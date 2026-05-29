/**
 * ============================================================
 *  ARQUIVO: node-agent/src/adbService.js
 * ============================================================
 *  Wrapper finíssimo em volta do binário `adb` (Android Debug
 *  Bridge). Expõe apenas o que o dashboard precisa:
 *    - listar devices ativos com metadados básicos
 *    - capturar screenshot (PNG)
 *    - retornar info detalhada de um device específico
 *
 *  Notas didáticas:
 *   - `adb devices -l` retorna 1 device por linha (depois do
 *     cabeçalho).
 *   - Para metadados usamos `getprop` em paralelo — mais rápido
 *     que serializar 3 chamadas sequenciais.
 *   - `exec-out screencap -p` despeja o PNG do device direto no
 *     stdout (sem precisar de arquivo temporário em `/sdcard`).
 *   - O agent é STATELESS: estado de locks vive no Postgres do
 *     dashboard.
 * ============================================================
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const config = require('./config');

const execAsync = promisify(exec);

function runAdb(args, opts = {}) {
    const cmd = `${config.adbPath} ${args}`;
    return execAsync(cmd, opts);
}

/**
 * Lista devices Android com metadados.
 * Retorno: Array<{ udid, status, platform, model, manufacturer, os_version }>
 */
async function getDevices() {
    let stdout;
    try {
        const r = await runAdb('devices -l');
        stdout = r.stdout;
    } catch (err) {
        console.error('[adb] falha ao listar devices:', err.message);
        return [];
    }

    const lines = stdout.split('\n').slice(1); // pula "List of devices attached"
    const out = [];

    for (const line of lines) {
        const t = line.trim();
        if (!t) continue;
        const parts = t.split(/\s+/);
        if (parts.length < 2) continue;

        const udid = parts[0];
        const adbStatus = parts[1]; // 'device' | 'offline' | 'unauthorized'

        const dev = {
            udid,
            status: adbStatus,
            platform: 'android',
            model: null,
            manufacturer: null,
            os_version: null
        };

        if (adbStatus === 'device') {
            const [modelR, mfgR, osR] = await Promise.allSettled([
                runAdb(`-s ${udid} shell getprop ro.product.model`),
                runAdb(`-s ${udid} shell getprop ro.product.manufacturer`),
                runAdb(`-s ${udid} shell getprop ro.build.version.release`)
            ]);
            if (modelR.status === 'fulfilled') dev.model        = modelR.value.stdout.trim();
            if (mfgR.status   === 'fulfilled') dev.manufacturer = mfgR.value.stdout.trim();
            if (osR.status    === 'fulfilled') dev.os_version   = osR.value.stdout.trim();
        }

        out.push(dev);
    }

    return out;
}

async function getDeviceInfo(udid) {
    const PROPS = [
        'ro.product.model', 'ro.product.manufacturer', 'ro.product.brand',
        'ro.product.device', 'ro.build.version.release', 'ro.build.version.sdk',
        'ro.serialno'
    ];
    const out = { udid };
    for (const p of PROPS) {
        try {
            const r = await runAdb(`-s ${udid} shell getprop ${p}`);
            out[p] = r.stdout.trim();
        } catch (_err) {
            out[p] = null;
        }
    }
    return out;
}

async function captureScreenshot(udid) {
    const cmd = `${config.adbPath} -s ${udid} exec-out screencap -p`;
    const r = await execAsync(cmd, {
        encoding: 'buffer',
        maxBuffer: 10 * 1024 * 1024 // 10MB
    });
    if (!r.stdout || r.stdout.length === 0) {
        throw new Error('Empty screenshot data');
    }
    return r.stdout;
}

// ============================================================
//  Interação (gravador): tap, gestos, dump de UI, app em foco.
// ============================================================

const ADB_UDID_RE = /^[A-Za-z0-9._:-]+$/;
function assertUdid(udid) {
    if (!udid || !ADB_UDID_RE.test(udid)) throw new Error(`UDID adb inválido: ${udid}`);
}

const KEYCODES = { home: 'KEYCODE_HOME', back: 'KEYCODE_BACK', recents: 'KEYCODE_APP_SWITCH' };

async function tap(udid, x, y) {
    assertUdid(udid);
    await runAdb(`-s ${udid} shell input tap ${Math.round(x)} ${Math.round(y)}`);
}

async function gesture(udid, action) {
    assertUdid(udid);
    const code = KEYCODES[action];
    if (!code) throw new Error(`gesto inválido: ${action} (use home|back|recents)`);
    await runAdb(`-s ${udid} shell input keyevent ${code}`);
}

// Digita texto no campo focado. POC minimalista: charset restrito (seguro contra
// injeção de shell) e espaço vira %s (como o `input text` espera).
async function inputText(udid, text) {
    assertUdid(udid);
    const t = String(text);
    if (!/^[A-Za-z0-9 .,@_+\-]*$/.test(t)) {
        throw new Error('texto: use apenas letras, números e . , @ _ + - espaço (POC)');
    }
    await runAdb(`-s ${udid} shell input text ${t.replace(/ /g, '%s')}`);
}

async function swipe(udid, x1, y1, x2, y2, durationMs = 300) {
    assertUdid(udid);
    const n = (v) => Math.round(Number(v) || 0);
    await runAdb(`-s ${udid} shell input swipe ${n(x1)} ${n(y1)} ${n(x2)} ${n(y2)} ${n(durationMs)}`);
}

async function launchApp(udid, pkg) {
    assertUdid(udid);
    if (!/^[A-Za-z0-9._]+$/.test(pkg)) throw new Error('package inválido');
    await runAdb(`-s ${udid} shell monkey -p ${pkg} -c android.intent.category.LAUNCHER 1`);
}

async function dumpUi(udid) {
    assertUdid(udid);
    await runAdb(`-s ${udid} shell uiautomator dump /sdcard/qatrack-ui.xml`);
    const r = await runAdb(`-s ${udid} shell cat /sdcard/qatrack-ui.xml`);
    return r.stdout;
}

async function foregroundApp(udid) {
    assertUdid(udid);
    const r = await runAdb(`-s ${udid} shell dumpsys window`);
    const m = r.stdout.match(/mCurrentFocus=Window\{[^ ]+ [^ ]+ ([^}\/]+)\/?([^}]*)\}/);
    return { package: m ? m[1] : null, activity: m && m[2] ? m[2] : null };
}

// Parse plano dos <node> do uiautomator dump.
function parseNodes(xml) {
    const nodes = [];
    const re = /<node\b([^>]*?)\/?>/g;
    let m;
    while ((m = re.exec(xml))) {
        const attrs = m[1];
        const get = (k) => { const a = attrs.match(new RegExp(`${k}="([^"]*)"`)); return a ? a[1] : ''; };
        const b = get('bounds').match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
        if (!b) continue;
        nodes.push({
            x1: +b[1], y1: +b[2], x2: +b[3], y2: +b[4],
            resourceId: get('resource-id'), class: get('class'),
            text: get('text'), contentDesc: get('content-desc'),
            clickable: get('clickable') === 'true'
        });
    }
    return nodes;
}

// Menor elemento (mais profundo) que contém o ponto (x,y).
function elementAtPoint(xml, x, y) {
    const hits = parseNodes(xml).filter(n => x >= n.x1 && x <= n.x2 && y >= n.y1 && y <= n.y2);
    if (!hits.length) return null;
    hits.sort((a, b) => ((a.x2 - a.x1) * (a.y2 - a.y1)) - ((b.x2 - b.x1) * (b.y2 - b.y1)));
    const n = hits[0];
    return {
        resourceId: n.resourceId || null, class: n.class || null,
        text: n.text || null, contentDesc: n.contentDesc || null,
        bounds: `[${n.x1},${n.y1}][${n.x2},${n.y2}]`, clickable: n.clickable
    };
}

async function elementAt(udid, x, y) {
    const xml = await dumpUi(udid);
    return elementAtPoint(xml, x, y);
}

module.exports = {
    getDevices, getDeviceInfo, captureScreenshot,
    tap, gesture, inputText, swipe, launchApp, dumpUi, foregroundApp, elementAt
};

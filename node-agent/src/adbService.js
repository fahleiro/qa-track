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

module.exports = { getDevices, getDeviceInfo, captureScreenshot };

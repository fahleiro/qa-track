/**
 * ============================================================
 *  ARQUIVO: node-agent/src/iosService.js
 * ============================================================
 *  Equivalente do adbService, porém para iOS via libimobiledevice
 *  (idevice_id / ideviceinfo / idevicescreenshot) + usbmuxd.
 *
 *  Notas didáticas:
 *   - iOS NÃO usa ADB. A pilha equivalente no Linux é
 *     usbmuxd (daemon de USB) + libimobiledevice (CLIs).
 *   - `idevice_id -l` lista UDIDs conectados (1 por linha).
 *   - `ideviceinfo -u <udid> -k <Chave>` lê uma propriedade.
 *   - `idevicescreenshot -u <udid> arq.png` salva o PNG (exige o
 *     Developer Disk Image montado; pode falhar em iOS recente).
 *   - Usamos execFile (array de args), NÃO exec(string), para
 *     evitar injeção de comando via udid.
 * ============================================================
 */

const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const config = require('./config');

const execFileAsync = promisify(execFile);

// UDID iOS: hex + possível hífen (ex.: 00008030-000259520205402E) ou 40 hex (legado).
const UDID_RE = /^[0-9A-Za-z.\-]+$/;

// ProductType → nome comercial (parcial; fallback no próprio ProductType).
const MARKETING = {
    'iPhone12,8': 'iPhone SE (2nd gen)',
    'iPhone14,6': 'iPhone SE (3rd gen)',
    'iPhone12,1': 'iPhone 11',
    'iPhone12,3': 'iPhone 11 Pro',
    'iPhone13,1': 'iPhone 12 mini',
    'iPhone13,2': 'iPhone 12',
    'iPhone13,3': 'iPhone 12 Pro',
    'iPhone14,5': 'iPhone 13',
    'iPhone14,2': 'iPhone 13 Pro',
    'iPhone14,7': 'iPhone 14',
    'iPhone15,2': 'iPhone 14 Pro',
    'iPhone15,4': 'iPhone 15',
    'iPhone16,1': 'iPhone 15 Pro',
    'iPhone16,2': 'iPhone 15 Pro Max',
    'iPad13,1':   'iPad Air (4th gen)',
    'iPad14,1':   'iPad mini (6th gen)'
};

function assertUdid(udid) {
    if (!udid || !UDID_RE.test(udid)) throw new Error(`UDID iOS inválido: ${udid}`);
}

/** Lista UDIDs de devices iOS conectados. Vazio se libimobiledevice/usbmuxd ausentes. */
async function listUdids() {
    try {
        const { stdout } = await execFileAsync(config.ideviceIdPath, ['-l'], { timeout: 8000 });
        return stdout.split('\n').map(s => s.trim()).filter(Boolean);
    } catch (err) {
        // Sem libimobiledevice ou sem usbmuxd → trata como "nenhum iOS".
        return [];
    }
}

async function infoKey(udid, key) {
    try {
        const { stdout } = await execFileAsync(config.ideviceinfoPath, ['-u', udid, '-k', key], { timeout: 8000 });
        return stdout.trim() || null;
    } catch (_err) {
        return null;
    }
}

/**
 * Lista devices iOS com metadados.
 * Retorno: Array<{ udid, status, platform:'ios', model, manufacturer:'Apple', os_version }>
 */
async function getIosDevices() {
    const udids = await listUdids();
    const out = [];
    for (const udid of udids) {
        if (!UDID_RE.test(udid)) continue;
        const [productType, productVersion] = await Promise.all([
            infoKey(udid, 'ProductType'),
            infoKey(udid, 'ProductVersion')
        ]);
        const model = (productType && MARKETING[productType]) || productType || null;
        out.push({
            udid,
            status: 'device',
            platform: 'ios',
            model,
            manufacturer: 'Apple',
            os_version: productVersion
        });
    }
    return out;
}

async function getIosDeviceInfo(udid) {
    assertUdid(udid);
    const KEYS = [
        'ProductType', 'ProductName', 'ProductVersion', 'BuildVersion',
        'DeviceName', 'DeviceClass', 'UniqueDeviceID', 'SerialNumber', 'CPUArchitecture'
    ];
    const out = { udid };
    for (const k of KEYS) out[k] = await infoKey(udid, k);
    return out;
}

async function captureIosScreenshot(udid) {
    assertUdid(udid);
    const tmp = path.join(os.tmpdir(), `ios-shot-${crypto.randomBytes(6).toString('hex')}.png`);
    try {
        // iOS 17/18: o screenshot vai pelo serviço DVT do pymobiledevice3, que
        // exige: Developer Mode ON no device, Developer Disk Image montado e o
        // tunnel RemoteXPC ativo (daemon `pymobiledevice3 remote tunneld` no host).
        // O `idevicescreenshot` (libimobiledevice) não cobre iOS 17+ — daí o pmd3.
        await execFileAsync(
            config.pymobiledevice3Path,
            ['developer', 'dvt', 'screenshot', tmp],
            { timeout: 25000, maxBuffer: 4 * 1024 * 1024 }
        );
        const buf = await fs.readFile(tmp);
        if (!buf || buf.length === 0) throw new Error('Screenshot iOS vazio');
        return buf;
    } finally {
        fs.unlink(tmp).catch(() => {});
    }
}

module.exports = { listUdids, getIosDevices, getIosDeviceInfo, captureIosScreenshot };

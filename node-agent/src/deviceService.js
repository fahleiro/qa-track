/**
 * ============================================================
 *  ARQUIVO: node-agent/src/deviceService.js
 * ============================================================
 *  Camada agregadora multi-plataforma. Unifica Android (adbService)
 *  e iOS (iosService) numa única lista para o resto do agent
 *  (registrar, rotas, screenshot) não precisar saber a plataforma.
 *
 *  Mantém um cache udid→platform alimentado a cada scan, usado para
 *  rotear info/screenshot. Se um udid chegar sem estar no cache
 *  (ex.: screenshot antes do 1º scan), faz detecção ao vivo.
 * ============================================================
 */

const adb = require('./adbService');
const ios = require('./iosService');

const platformByUdid = new Map();

/** Lista unificada Android + iOS. Cada item já vem com `platform`. */
async function getDevices() {
    const [android, iosList] = await Promise.all([
        adb.getDevices().catch(() => []),
        ios.getIosDevices().catch(() => [])
    ]);
    const all = [...android, ...iosList];
    for (const d of all) if (d.udid) platformByUdid.set(d.udid, d.platform);
    return all;
}

async function resolvePlatform(udid) {
    if (platformByUdid.has(udid)) return platformByUdid.get(udid);
    const iosUdids = await ios.listUdids().catch(() => []);
    const platform = iosUdids.includes(udid) ? 'ios' : 'android';
    platformByUdid.set(udid, platform);
    return platform;
}

async function getDeviceInfo(udid) {
    const platform = await resolvePlatform(udid);
    return platform === 'ios' ? ios.getIosDeviceInfo(udid) : adb.getDeviceInfo(udid);
}

async function captureScreenshot(udid) {
    const platform = await resolvePlatform(udid);
    return platform === 'ios' ? ios.captureIosScreenshot(udid) : adb.captureScreenshot(udid);
}

module.exports = { getDevices, getDeviceInfo, captureScreenshot };

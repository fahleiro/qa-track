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

// ---------- Interação (gravador) — roteado por plataforma ----------

function iosUnsupported(msg) { const e = new Error(msg); e.code = 'IOS_UNSUPPORTED'; return e; }

async function getSource(udid) {
    const platform = await resolvePlatform(udid);
    if (platform === 'ios') return { platform: 'ios', elements: await ios.listElements(udid) };
    return { platform: 'android', xml: await adb.dumpUi(udid) };
}

async function tap(udid, x, y) {
    const platform = await resolvePlatform(udid);
    if (platform === 'ios') throw iosUnsupported('Tap por coordenada em iOS requer WebDriverAgent assinado');
    const element = await adb.elementAt(udid, x, y).catch(() => null);
    await adb.tap(udid, x, y);
    return { platform: 'android', tapped: { x, y }, element };
}

async function gesture(udid, action) {
    const platform = await resolvePlatform(udid);
    if (platform === 'ios') throw iosUnsupported('Gestos (home/back/recents) em iOS requerem WebDriverAgent assinado');
    await adb.gesture(udid, action);
    return { platform: 'android', action };
}

async function setText(udid, text) {
    const platform = await resolvePlatform(udid);
    if (platform === 'ios') throw iosUnsupported('Set text em iOS requer WebDriverAgent assinado');
    await adb.inputText(udid, text);
    return { platform: 'android', text };
}

async function swipe(udid, x1, y1, x2, y2, durationMs) {
    const platform = await resolvePlatform(udid);
    if (platform === 'ios') throw iosUnsupported('Swipe em iOS requer WebDriverAgent assinado');
    await adb.swipe(udid, x1, y1, x2, y2, durationMs);
    return { platform: 'android', swipe: { x1, y1, x2, y2 } };
}

async function launch(udid, appId) {
    const platform = await resolvePlatform(udid);
    if (platform === 'ios') { await ios.launchApp(udid, appId); return { platform: 'ios', launched: appId }; }
    await adb.launchApp(udid, appId);
    return { platform: 'android', launched: appId };
}

async function foreground(udid) {
    const platform = await resolvePlatform(udid);
    if (platform === 'android') return { platform: 'android', ...(await adb.foregroundApp(udid)) };
    return { platform: 'ios', note: 'foreground app no iOS depende de WDA — pendente' };
}

module.exports = {
    getDevices, getDeviceInfo, captureScreenshot,
    getSource, tap, gesture, setText, swipe, launch, foreground
};

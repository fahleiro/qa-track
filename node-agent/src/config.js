/**
 * ============================================================
 *  ARQUIVO: node-agent/src/config.js
 * ============================================================
 *  Centraliza configuração lida do .env (via dotenv).
 *  Defaults sensatos para dev local.
 * ============================================================
 */

require('dotenv').config();

module.exports = {
    dashboardUrl:    process.env.DASHBOARD_URL     || 'http://localhost:3000',
    agentName:       process.env.AGENT_NAME        || 'unnamed-agent',
    agentPublicUrl:  process.env.AGENT_PUBLIC_URL  || 'http://localhost:4724',
    agentPort:       parseInt(process.env.AGENT_PORT || '4724', 10),

    // Caminho do ADB (Android). Se vazio, usamos o do PATH.
    adbPath:         process.env.ADB_PATH          || 'adb',

    // Caminhos das CLIs libimobiledevice (iOS — listagem/metadados). Default: do PATH.
    ideviceIdPath:         process.env.IDEVICE_ID_PATH         || 'idevice_id',
    ideviceinfoPath:       process.env.IDEVICEINFO_PATH        || 'ideviceinfo',
    idevicescreenshotPath: process.env.IDEVICESCREENSHOT_PATH  || 'idevicescreenshot',

    // pymobiledevice3 — usado para screenshot em iOS 17+ (via DVT + tunneld).
    pymobiledevice3Path:   process.env.PYMOBILEDEVICE3_PATH    || 'pymobiledevice3',

    // Versão do agent — anunciada no register/heartbeat.
    version:         '0.4.1',

    // Cadência do heartbeat.
    heartbeatIntervalMs: 30 * 1000,

    // Timeout das chamadas ao dashboard.
    httpTimeoutMs: 5000
};

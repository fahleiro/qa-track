/**
 * ============================================================
 *  ARQUIVO: node-agent/src/registrar.js
 * ============================================================
 *  Mantém o relacionamento agent→dashboard via dois eventos:
 *
 *    1. REGISTER (no boot)      → POST /api/nodes/register
 *       Anuncia name, public_url, version, snapshot inicial.
 *       Backoff exponencial se o dashboard ainda não subiu.
 *
 *    2. HEARTBEAT (a cada 30s)  → POST /api/nodes/heartbeat
 *       Envia snapshot atual de devices. Dashboard usa para
 *       atualizar `t_node.last_heartbeat` (janela 60s = online).
 * ============================================================
 */

const axios = require('axios');
const config = require('./config');
const { getDevices } = require('./deviceService');

const http = axios.create({
    baseURL: config.dashboardUrl,
    timeout: config.httpTimeoutMs,
    headers: { 'Content-Type': 'application/json' }
});

async function safeScan() {
    try {
        return await getDevices();
    } catch (err) {
        console.warn('[agent] falha ao escanear devices:', err.message);
        return [];
    }
}

async function registerOnce(devices) {
    return http.post('/api/nodes/register', {
        name: config.agentName,
        public_url: config.agentPublicUrl,
        version: config.version,
        devices
    });
}

async function heartbeatOnce(devices) {
    return http.post('/api/nodes/heartbeat', {
        name: config.agentName,
        devices
    });
}

async function startRegistrar() {
    // ---------- REGISTER no boot (com backoff exponencial) ----------
    let attempt = 0;
    while (true) {
        const devices = await safeScan();
        try {
            await registerOnce(devices);
            console.log(`[agent] Registered with dashboard. ${devices.length} device(s) reported.`);
            break;
        } catch (err) {
            attempt += 1;
            const delay = Math.min(2000 * 2 ** Math.min(attempt - 1, 4), 30000);
            const reason = err.response ? `${err.response.status} ${JSON.stringify(err.response.data)}` : err.message;
            console.warn(`[agent] register falhou (tentativa ${attempt}): ${reason}. Retry em ${delay / 1000}s.`);
            await new Promise(r => setTimeout(r, delay));
        }
    }

    // ---------- HEARTBEAT loop ----------
    setInterval(async () => {
        const devices = await safeScan();
        try {
            await heartbeatOnce(devices);
            console.log(`[agent] heartbeat OK (${devices.length} devices)`);
        } catch (err) {
            const reason = err.response ? `${err.response.status}` : err.message;
            console.warn(`[agent] heartbeat falhou: ${reason}`);
        }
    }, config.heartbeatIntervalMs);
}

module.exports = { startRegistrar };

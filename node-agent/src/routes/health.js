/**
 * ============================================================
 *  ARQUIVO: node-agent/src/routes/health.js
 * ============================================================
 *  GET /agent/health — sanity check usado pelo dashboard e ops.
 *  Retorna name/version/uptime e o número de devices visíveis.
 * ============================================================
 */

const config = require('../config');
const { getDevices } = require('../adbService');

module.exports = (app) => {
    const startedAt = Date.now();

    app.get('/agent/health', async (_req, res) => {
        let devicesCount = 0;
        try {
            const list = await getDevices();
            devicesCount = list.length;
        } catch (_err) {
            // health não falha por causa de ADB — apenas reporta 0.
        }
        res.json({
            ok: true,
            name: config.agentName,
            version: config.version,
            uptime_ms: Date.now() - startedAt,
            devices_count: devicesCount
        });
    });
};

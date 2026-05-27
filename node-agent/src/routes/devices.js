/**
 * ============================================================
 *  ARQUIVO: node-agent/src/routes/devices.js
 * ============================================================
 *  GET /agent/devices            — lista devices live (scan ADB)
 *  GET /agent/devices/:udid/info — getprop completo (debug)
 *
 *  Chamado pelo dashboard via fan-out HTTP a cada listagem.
 * ============================================================
 */

const { getDevices, getDeviceInfo } = require('../adbService');

module.exports = (app) => {

    app.get('/agent/devices', async (_req, res) => {
        try {
            const devices = await getDevices();
            res.json({ devices });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/agent/devices/:udid/info', async (req, res) => {
        try {
            res.json(await getDeviceInfo(req.params.udid));
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
};

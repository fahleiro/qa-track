/**
 * ============================================================
 *  ARQUIVO: node-agent/src/routes/screenshot.js
 * ============================================================
 *  GET /agent/devices/:udid/screenshot — PNG do device.
 *
 *  Acessado pelo dashboard como proxy: o usuário no browser
 *  pede /api/devicefarm/devices/:udid/screenshot, o dashboard
 *  chama este endpoint no node correspondente, e devolve o PNG.
 * ============================================================
 */

const { captureScreenshot } = require('../screenshotService');

module.exports = (app) => {
    app.get('/agent/devices/:udid/screenshot', async (req, res) => {
        try {
            const buf = await captureScreenshot(req.params.udid);
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Cache-Control', 'no-store');
            res.send(buf);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
};

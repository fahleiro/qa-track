/**
 * ============================================================
 *  ARQUIVO: node-agent/src/routes/interaction.js
 * ============================================================
 *  Endpoints de interação usados pelo gravador do dashboard:
 *    GET  /agent/devices/:udid/source       — árvore de elementos
 *    POST /agent/devices/:udid/tap          {x,y}      (Android)
 *    POST /agent/devices/:udid/gesture      {action}   home|back|recents
 *    POST /agent/devices/:udid/launch       {app}      pkg (Android) / bundle (iOS)
 *    GET  /agent/devices/:udid/foreground   — app em primeiro plano
 *
 *  iOS por coordenada/gestos retorna 501 (precisa de WDA assinado).
 * ============================================================
 */

const { getSource, tap, gesture, setText, swipe, launch, foreground } = require('../deviceService');

const statusFor = (err) => (err.code === 'IOS_UNSUPPORTED' ? 501 : 500);

module.exports = (app) => {
    app.get('/agent/devices/:udid/source', async (req, res) => {
        try { res.json(await getSource(req.params.udid)); }
        catch (err) { res.status(statusFor(err)).json({ error: err.message }); }
    });

    app.post('/agent/devices/:udid/tap', async (req, res) => {
        const { x, y } = req.body || {};
        if (typeof x !== 'number' || typeof y !== 'number') {
            return res.status(400).json({ error: 'x e y numéricos são obrigatórios' });
        }
        try { res.json(await tap(req.params.udid, x, y)); }
        catch (err) { res.status(statusFor(err)).json({ error: err.message }); }
    });

    app.post('/agent/devices/:udid/gesture', async (req, res) => {
        try { res.json(await gesture(req.params.udid, (req.body || {}).action)); }
        catch (err) { res.status(statusFor(err)).json({ error: err.message }); }
    });

    app.post('/agent/devices/:udid/swipe', async (req, res) => {
        const { x1, y1, x2, y2, duration } = req.body || {};
        if ([x1, y1, x2, y2].some(v => typeof v !== 'number')) {
            return res.status(400).json({ error: 'x1,y1,x2,y2 numéricos são obrigatórios' });
        }
        try { res.json(await swipe(req.params.udid, x1, y1, x2, y2, typeof duration === 'number' ? duration : 300)); }
        catch (err) { res.status(statusFor(err)).json({ error: err.message }); }
    });

    app.post('/agent/devices/:udid/text', async (req, res) => {
        const { text } = req.body || {};
        if (typeof text !== 'string') return res.status(400).json({ error: 'text (string) é obrigatório' });
        try { res.json(await setText(req.params.udid, text)); }
        catch (err) { res.status(statusFor(err)).json({ error: err.message }); }
    });

    app.post('/agent/devices/:udid/launch', async (req, res) => {
        const { app: appId } = req.body || {};
        if (!appId) return res.status(400).json({ error: 'app (pkg/bundle) é obrigatório' });
        try { res.json(await launch(req.params.udid, appId)); }
        catch (err) { res.status(statusFor(err)).json({ error: err.message }); }
    });

    app.get('/agent/devices/:udid/foreground', async (req, res) => {
        try { res.json(await foreground(req.params.udid)); }
        catch (err) { res.status(statusFor(err)).json({ error: err.message }); }
    });
};

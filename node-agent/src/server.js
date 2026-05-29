/**
 * ============================================================
 *  ARQUIVO: node-agent/src/server.js
 * ============================================================
 *  Bootstrap do node-agent. Sobe um Express minúsculo na porta
 *  AGENT_PORT (default 4724) e dispara o registrar para falar
 *  com o QA Track dashboard.
 *
 *  É o equivalente "spoke" do dashboard "hub": stateless, sem
 *  banco, só executa ADB localmente e responde HTTP.
 * ============================================================
 */

const express = require('express');
const config = require('./config');

const healthRoutes      = require('./routes/health');
const devicesRoutes     = require('./routes/devices');
const screenshotRoutes  = require('./routes/screenshot');
const interactionRoutes = require('./routes/interaction');
const { startRegistrar } = require('./registrar');

const app = express();
app.use(express.json());

// CORS aberto: o dashboard pode estar em outra origem (porta).
// Não há dados sensíveis no node-agent — credenciais ficam no dashboard.
app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

healthRoutes(app);
devicesRoutes(app);
screenshotRoutes(app);
interactionRoutes(app);

app.listen(config.agentPort, '0.0.0.0', () => {
    console.log(`[agent] HTTP em :${config.agentPort} (name=${config.agentName})`);
    console.log(`[agent] dashboard=${config.dashboardUrl}  public_url=${config.agentPublicUrl}`);
    startRegistrar().catch(err => {
        console.error('[agent] registrar fatal:', err.message);
    });
});

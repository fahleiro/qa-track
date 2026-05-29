/**
* ============================================================
*  ROTAS DA API BACKEND
* ============================================================
*
*  Cada módulo exporta `(app, pool) => { ... }`. As rotas legadas
*  (system, feature, scenario, status, run, kanban, config) usam
*  `pool.query()`, que tem a mesma assinatura do antigo
*  `client.query()` — não precisam ser alteradas.
* ============================================================
*/

const authRoutes       = require('./api/auth');
const statusRoutes     = require('./api/status');
const scenarioRoutes   = require('./api/scenario');
const systemRoutes     = require('./api/system');
const featureRoutes    = require('./api/feature');
const configRoutes     = require('./api/config');
const kanbanRoutes     = require('./api/kanban');
const runRoutes        = require('./api/run');
const nodesRoutes      = require('./api/nodes');
const devicefarmRoutes = require('./api/devicefarm');

module.exports = (app, pool) => {
    authRoutes(app, pool);
    statusRoutes(app, pool);
    scenarioRoutes(app, pool);
    systemRoutes(app, pool);
    featureRoutes(app, pool);
    configRoutes(app, pool);
    kanbanRoutes(app, pool);
    runRoutes(app, pool);
    nodesRoutes(app, pool);
    devicefarmRoutes(app, pool);

    console.log('Rotas da API v0.4.1 registradas: auth, status, scenario, system, feature, config, kanban, run, nodes, devicefarm');
};

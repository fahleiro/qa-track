/**
* ====================================
* ROTAS DA API BACKEND
* ====================================
*/

const statusRoutes = require('./api/status');
const scenarioRoutes = require('./api/scenario');
const systemRoutes = require('./api/system');
const featureRoutes = require('./api/feature');
const configRoutes = require('./api/config');
const kanbanRoutes = require('./api/kanban');
const runRoutes = require('./api/run');

module.exports = (app, client) => {
    // Registrar todas as rotas
    statusRoutes(app, client);
    scenarioRoutes(app, client);
    systemRoutes(app, client);
    featureRoutes(app, client);
    configRoutes(app, client);
    kanbanRoutes(app, client);
    runRoutes(app, client);

    console.log('Rotas da API v0.1.0 registradas com sucesso');
};

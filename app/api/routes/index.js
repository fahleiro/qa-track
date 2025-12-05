/**
* ====================================
* ROTAS DA API BACKEND
* v0.1.0
* ====================================
*/

const statusRoutes = require('./api/status');
const scenarioRoutes = require('./api/scenario');
const systemRoutes = require('./api/system');
const featureRoutes = require('./api/feature');

module.exports = (app, client) => {
    // Registrar todas as rotas
    statusRoutes(app, client);
    scenarioRoutes(app, client);
    systemRoutes(app, client);
    featureRoutes(app, client);

    console.log('Rotas da API v0.1.0 registradas com sucesso');
};

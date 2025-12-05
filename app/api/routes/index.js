/**
* ====================================
* ROTAS DA API BACKEND
* ====================================
*/

const configStatusRoutes = require('./api/status');
const scenarioRoutes = require('./api/scenario');
const systemRoutes = require('./api/system');

module.exports = (app, client) => {
    // Registrar todas as rotas
    configStatusRoutes(app, client);
    scenarioRoutes(app, client);
    systemRoutes(app, client);

    console.log('Rotas da API registradas com sucesso');
};


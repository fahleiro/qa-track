/**
* ====================================
* ROTAS DA API BACKEND
* ====================================
*/

const configStatusRoutes = require('./api/config/status');
const suiteRoutes = require('./api/suite');
const scenarioRoutes = require('./api/scenario');
const runRoutes = require('./api/run');
const resultRoutes = require('./api/result');
const systemRoutes = require('./api/system');
const flowRoutes = require('./api/flow');

module.exports = (app, client) => {
    // Registrar todas as rotas
    configStatusRoutes(app, client);
    suiteRoutes(app, client);
    scenarioRoutes(app, client);
    runRoutes(app, client);
    resultRoutes(app, client);
    systemRoutes(app, client);
    flowRoutes(app, client);

    console.log('✓ Rotas da API registradas com sucesso');
};


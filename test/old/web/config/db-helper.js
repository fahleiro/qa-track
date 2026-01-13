/**
 * ====================================
 * HELPER DE BANCO DE DADOS
 * ====================================
 * Funções auxiliares para validação no PostgreSQL
 */

const { Client } = require('pg');
const path = require('path');

// Carrega configuração do banco
const dbConfig = require(path.join(__dirname, '../../db/db_connect.json'));

/**
 * Cria uma conexão com o banco de dados
 * @returns {Promise<Client>}
 */
async function createConnection() {
    const client = new Client(dbConfig);
    await client.connect();
    return client;
}

/**
 * Fecha a conexão com o banco
 * @param {Client} client 
 */
async function closeConnection(client) {
    if (client) {
        await client.end();
    }
}

/**
 * Verifica se um sistema existe pelo título
 * @param {string} title 
 * @returns {Promise<{exists: boolean, data: object|null}>}
 */
async function findSystemByTitle(title) {
    const client = await createConnection();
    try {
        const result = await client.query(
            'SELECT * FROM t_system WHERE title = $1',
            [title]
        );
        return {
            exists: result.rows.length > 0,
            data: result.rows[0] || null
        };
    } finally {
        await closeConnection(client);
    }
}

/**
 * Verifica se uma feature existe pelo título
 * @param {string} title 
 * @returns {Promise<{exists: boolean, data: object|null}>}
 */
async function findFeatureByTitle(title) {
    const client = await createConnection();
    try {
        const result = await client.query(
            'SELECT * FROM t_feature WHERE title = $1',
            [title]
        );
        return {
            exists: result.rows.length > 0,
            data: result.rows[0] || null
        };
    } finally {
        await closeConnection(client);
    }
}

/**
 * Verifica se um status de cenário existe pelo título
 * @param {string} title 
 * @returns {Promise<{exists: boolean, data: object|null}>}
 */
async function findStatusByTitle(title) {
    const client = await createConnection();
    try {
        const result = await client.query(
            'SELECT * FROM t_scenario_status WHERE title = $1',
            [title]
        );
        return {
            exists: result.rows.length > 0,
            data: result.rows[0] || null
        };
    } finally {
        await closeConnection(client);
    }
}

/**
 * Obtém um sistema pelo ID
 * @param {number} id 
 * @returns {Promise<object|null>}
 */
async function getSystemById(id) {
    const client = await createConnection();
    try {
        const result = await client.query(
            'SELECT * FROM t_system WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    } finally {
        await closeConnection(client);
    }
}

/**
 * Obtém uma feature pelo ID
 * @param {number} id 
 * @returns {Promise<object|null>}
 */
async function getFeatureById(id) {
    const client = await createConnection();
    try {
        const result = await client.query(
            'SELECT * FROM t_feature WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    } finally {
        await closeConnection(client);
    }
}

/**
 * Obtém um status pelo ID
 * @param {number} id 
 * @returns {Promise<object|null>}
 */
async function getStatusById(id) {
    const client = await createConnection();
    try {
        const result = await client.query(
            'SELECT * FROM t_scenario_status WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    } finally {
        await closeConnection(client);
    }
}

/**
 * Lista todos os sistemas
 * @returns {Promise<Array>}
 */
async function getAllSystems() {
    const client = await createConnection();
    try {
        const result = await client.query('SELECT * FROM t_system ORDER BY id DESC');
        return result.rows;
    } finally {
        await closeConnection(client);
    }
}

/**
 * Lista todas as features
 * @returns {Promise<Array>}
 */
async function getAllFeatures() {
    const client = await createConnection();
    try {
        const result = await client.query('SELECT * FROM t_feature ORDER BY id DESC');
        return result.rows;
    } finally {
        await closeConnection(client);
    }
}

/**
 * Lista todos os status
 * @returns {Promise<Array>}
 */
async function getAllStatuses() {
    const client = await createConnection();
    try {
        const result = await client.query('SELECT * FROM t_scenario_status ORDER BY id DESC');
        return result.rows;
    } finally {
        await closeConnection(client);
    }
}

/**
 * Lista cenários filtrados por sistema
 * @param {number} systemId 
 * @returns {Promise<Array>}
 */
async function getScenariosBySystem(systemId) {
    const client = await createConnection();
    try {
        const result = await client.query(`
            SELECT s.* FROM t_scenario s
            INNER JOIN t_scenario_system ss ON s.id = ss.scenario_id
            WHERE ss.system_id = $1
            ORDER BY s.id DESC
        `, [systemId]);
        return result.rows;
    } finally {
        await closeConnection(client);
    }
}

/**
 * Lista cenários filtrados por status
 * @param {number} statusId 
 * @returns {Promise<Array>}
 */
async function getScenariosByStatus(statusId) {
    const client = await createConnection();
    try {
        const result = await client.query(
            'SELECT * FROM t_scenario WHERE status_id = $1 ORDER BY id DESC',
            [statusId]
        );
        return result.rows;
    } finally {
        await closeConnection(client);
    }
}

/**
 * Remove um sistema pelo título (para cleanup de testes)
 * @param {string} title 
 * @returns {Promise<boolean>}
 */
async function deleteSystemByTitle(title) {
    const client = await createConnection();
    try {
        const result = await client.query(
            'DELETE FROM t_system WHERE title = $1 RETURNING id',
            [title]
        );
        return result.rows.length > 0;
    } finally {
        await closeConnection(client);
    }
}

/**
 * Remove uma feature pelo título (para cleanup de testes)
 * @param {string} title 
 * @returns {Promise<boolean>}
 */
async function deleteFeatureByTitle(title) {
    const client = await createConnection();
    try {
        const result = await client.query(
            'DELETE FROM t_feature WHERE title = $1 RETURNING id',
            [title]
        );
        return result.rows.length > 0;
    } finally {
        await closeConnection(client);
    }
}

/**
 * Remove um status pelo título (para cleanup de testes)
 * @param {string} title 
 * @returns {Promise<boolean>}
 */
async function deleteStatusByTitle(title) {
    const client = await createConnection();
    try {
        const result = await client.query(
            'DELETE FROM t_scenario_status WHERE title = $1 RETURNING id',
            [title]
        );
        return result.rows.length > 0;
    } finally {
        await closeConnection(client);
    }
}

/**
 * Executa uma query customizada
 * @param {string} query 
 * @param {Array} params 
 * @returns {Promise<Array>}
 */
async function executeQuery(query, params = []) {
    const client = await createConnection();
    try {
        const result = await client.query(query, params);
        return result.rows;
    } finally {
        await closeConnection(client);
    }
}

module.exports = {
    createConnection,
    closeConnection,
    findSystemByTitle,
    findFeatureByTitle,
    findStatusByTitle,
    getSystemById,
    getFeatureById,
    getStatusById,
    getAllSystems,
    getAllFeatures,
    getAllStatuses,
    getScenariosBySystem,
    getScenariosByStatus,
    deleteSystemByTitle,
    deleteFeatureByTitle,
    deleteStatusByTitle,
    executeQuery
};

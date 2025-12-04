/**
 * ====================================
 * VALIDAÇÃO DE RELAÇÕES DO BANCO
 * ====================================
 */

/**
 * Lista de todas as tabelas necessárias no sistema
 */
const REQUIRED_TABLES = [
    't_scenario_status',
    't_result_status',
    't_flow_detail',
    't_flow',
    't_run_status',
    't_suite',
    't_scenario',
    't_scenario_pre',
    't_scenario_expect',
    't_scenario_system',
    't_run',
    't_run_detail',
    't_result'
];

/**
 * Lista todas as tabelas existentes no banco de dados
 * @param {Client} client - Cliente PostgreSQL
 * @returns {Promise<{tables: string[], errors: string[]}>}
 */
async function listDatabaseTables(client) {
    const errors = [];
    
    try {
        const query = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `;
        
        const result = await client.query(query);
        const tables = result.rows.map(row => row.table_name);
        
        return {
            tables,
            errors
        };
    } catch (err) {
        errors.push(`Erro ao listar tabelas: ${err.message}`);
        return {
            tables: [],
            errors
        };
    }
}

/**
 * Valida se todas as tabelas necessárias existem no banco de dados
 * @param {Client} client - Cliente PostgreSQL
 * @returns {Promise<{valid: boolean, missing: string[], errors: string[], existingTables: string[]}>}
 */
async function validateDatabaseTables(client) {
    const missing = [];
    const errors = [];

    try {
        // Lista todas as tabelas existentes no banco
        const { tables: existingTables, errors: listErrors } = await listDatabaseTables(client);
        
        if (listErrors.length > 0) {
            errors.push(...listErrors);
        }
        
        // Verifica cada tabela necessária
        for (const tableName of REQUIRED_TABLES) {
            if (!existingTables.includes(tableName)) {
                missing.push(tableName);
            }
        }

        const valid = missing.length === 0 && errors.length === 0;

        return {
            valid,
            missing,
            errors,
            existingTables
        };
    } catch (err) {
        errors.push(`Erro geral na validação: ${err.message}`);
        return {
            valid: false,
            missing: [],
            errors,
            existingTables: []
        };
    }
}

module.exports = {
    validateDatabaseTables,
    listDatabaseTables,
    REQUIRED_TABLES
};
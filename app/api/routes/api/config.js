/**
* ====================================
* ROTAS PARA EXPORTAÇÃO E IMPORTAÇÃO DE CONFIGURAÇÃO
* ====================================
*/

const CONFIG_VERSION = '0.1.0';

// Tabelas de configuração na ordem de exportação
const CONFIG_TABLES = [
    't_system',
    't_feature',
    't_scenario_status',
    't_scenario',
    't_scenario_system',
    't_scenario_pre',
    't_scenario_expect'
];

// Ordem de importação (respeitando dependências)
const IMPORT_ORDER = [
    't_scenario_status',  // sem dependências
    't_system',           // sem dependências
    't_feature',          // depende de system
    't_scenario',         // depende de feature e status
    't_scenario_system',  // depende de scenario e system
    't_scenario_pre',     // depende de scenario
    't_scenario_expect'   // depende de scenario
];

/**
 * Valida estrutura básica do JSON de importação
 */
function validateImportSchema(data) {
    const errors = [];

    if (!data || typeof data !== 'object') {
        errors.push('JSON inválido: deve ser um objeto');
        return { valid: false, errors };
    }

    if (!data.version) {
        errors.push('Campo "version" é obrigatório');
    }

    // Verificar se pelo menos uma tabela está presente
    const hasTables = CONFIG_TABLES.some(table => Array.isArray(data[table]));
    if (!hasTables) {
        errors.push('Nenhuma tabela de configuração encontrada no JSON');
    }

    // Validar estrutura de cada tabela presente
    for (const table of CONFIG_TABLES) {
        if (data[table] !== undefined && !Array.isArray(data[table])) {
            errors.push(`Campo "${table}" deve ser um array`);
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Verifica duplicatas de IDs em cada tabela
 */
async function checkDuplicates(client, data) {
    const duplicates = [];

    // Tabelas com campo id
    const tablesWithId = [
        't_system',
        't_feature',
        't_scenario_status',
        't_scenario',
        't_scenario_pre',
        't_scenario_expect'
    ];

    for (const table of tablesWithId) {
        if (data[table] && Array.isArray(data[table]) && data[table].length > 0) {
            const ids = data[table].map(row => row.id).filter(id => id !== undefined);
            if (ids.length > 0) {
                const result = await client.query(
                    `SELECT id FROM ${table} WHERE id = ANY($1)`,
                    [ids]
                );
                if (result.rows.length > 0) {
                    const existingIds = result.rows.map(r => r.id);
                    duplicates.push({
                        table,
                        ids: existingIds
                    });
                }
            }
        }
    }

    // Verificar t_scenario_system (chave composta)
    if (data.t_scenario_system && Array.isArray(data.t_scenario_system)) {
        for (const row of data.t_scenario_system) {
            if (row.scenario_id && row.system_id) {
                const result = await client.query(
                    'SELECT scenario_id, system_id FROM t_scenario_system WHERE scenario_id = $1 AND system_id = $2',
                    [row.scenario_id, row.system_id]
                );
                if (result.rows.length > 0) {
                    duplicates.push({
                        table: 't_scenario_system',
                        ids: [`scenario_id=${row.scenario_id}, system_id=${row.system_id}`]
                    });
                }
            }
        }
    }

    return duplicates;
}

/**
 * Importa dados na ordem correta respeitando dependências
 */
async function importData(client, data) {
    const results = {
        inserted: {},
        errors: []
    };

    for (const table of IMPORT_ORDER) {
        if (!data[table] || !Array.isArray(data[table]) || data[table].length === 0) {
            continue;
        }

        results.inserted[table] = 0;

        for (const row of data[table]) {
            try {
                await insertRow(client, table, row);
                results.inserted[table]++;
            } catch (err) {
                results.errors.push({
                    table,
                    row,
                    error: err.message
                });
            }
        }
    }

    return results;
}

/**
 * Insere uma linha em uma tabela específica
 */
async function insertRow(client, table, row) {
    switch (table) {
        case 't_system':
            await client.query(
                'INSERT INTO t_system (id, title) VALUES ($1, $2)',
                [row.id, row.title]
            );
            break;

        case 't_feature':
            await client.query(
                'INSERT INTO t_feature (id, title, system_id) VALUES ($1, $2, $3)',
                [row.id, row.title, row.system_id]
            );
            break;

        case 't_scenario_status':
            await client.query(
                'INSERT INTO t_scenario_status (id, title) VALUES ($1, $2)',
                [row.id, row.title]
            );
            break;

        case 't_scenario':
            await client.query(
                'INSERT INTO t_scenario (id, title, status_id, feature_id) VALUES ($1, $2, $3, $4)',
                [row.id, row.title, row.status_id || null, row.feature_id || null]
            );
            break;

        case 't_scenario_system':
            await client.query(
                'INSERT INTO t_scenario_system (scenario_id, system_id) VALUES ($1, $2)',
                [row.scenario_id, row.system_id]
            );
            break;

        case 't_scenario_pre':
            await client.query(
                'INSERT INTO t_scenario_pre (id, scenario_id, description) VALUES ($1, $2, $3)',
                [row.id, row.scenario_id, row.description]
            );
            break;

        case 't_scenario_expect':
            await client.query(
                'INSERT INTO t_scenario_expect (id, scenario_id, description) VALUES ($1, $2, $3)',
                [row.id, row.scenario_id, row.description]
            );
            break;

        default:
            throw new Error(`Tabela desconhecida: ${table}`);
    }
}

/**
 * Atualiza as sequences do PostgreSQL após importação com IDs explícitos
 */
async function updateSequences(client) {
    const tablesWithSequence = [
        't_system',
        't_feature',
        't_scenario_status',
        't_scenario',
        't_scenario_pre',
        't_scenario_expect'
    ];

    for (const table of tablesWithSequence) {
        await client.query(`
            SELECT setval(
                pg_get_serial_sequence('${table}', 'id'),
                COALESCE((SELECT MAX(id) FROM ${table}), 1),
                true
            )
        `);
    }
}

module.exports = (app, client) => {

    // GET: Exportar configuração como JSON
    app.get('/api/config/export', async (req, res) => {
        try {
            const exportData = {
                version: CONFIG_VERSION,
                exportedAt: new Date().toISOString()
            };

            // Buscar dados de cada tabela
            for (const table of CONFIG_TABLES) {
                const result = await client.query(`SELECT * FROM ${table}`);
                exportData[table] = result.rows;
            }

            // Definir headers para download
            const filename = `qa-track-config-${new Date().toISOString().split('T')[0]}.json`;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            
            res.json(exportData);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST: Importar configuração de JSON
    app.post('/api/config/import', async (req, res) => {
        const data = req.body;

        // 1. Validar estrutura do JSON
        const validation = validateImportSchema(data);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: 'Estrutura JSON inválida',
                details: validation.errors
            });
        }

        try {
            // 2. Verificar duplicatas
            const duplicates = await checkDuplicates(client, data);
            if (duplicates.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: 'IDs duplicados encontrados no banco de dados',
                    duplicates
                });
            }

            // 3. Iniciar transação
            await client.query('BEGIN');

            try {
                // 4. Importar dados na ordem correta
                const importResults = await importData(client, data);

                // 5. Verificar se houve erros durante a importação
                if (importResults.errors.length > 0) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({
                        success: false,
                        error: 'Erros durante a importação',
                        details: importResults.errors
                    });
                }

                // 6. Atualizar sequences
                await updateSequences(client);

                // 7. Commit da transação
                await client.query('COMMIT');

                res.json({
                    success: true,
                    message: 'Configuração importada com sucesso',
                    inserted: importResults.inserted
                });

            } catch (err) {
                await client.query('ROLLBACK');
                throw err;
            }

        } catch (err) {
            res.status(500).json({
                success: false,
                error: err.message
            });
        }
    });
};


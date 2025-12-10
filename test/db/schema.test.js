/**
 * ====================================
 * TESTES DE VALIDAÇÃO DO SCHEMA DO DB
 * ====================================
 * Valida estrutura das tabelas PostgreSQL
 */

const { Client } = require('pg');

// Configuração do banco (mesma do build)
const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.P_POSTGRES || 5432,
    database: 'qa_test_track',
    user: 'postgres'
};

// Schema esperado das tabelas
const EXPECTED_SCHEMA = {
    t_system: {
        columns: {
            id: { type: 'integer', nullable: false, default: true },
            title: { type: 'text', nullable: false }
        },
        primaryKey: ['id'],
        unique: ['title']
    },
    t_feature: {
        columns: {
            id: { type: 'integer', nullable: false, default: true },
            title: { type: 'text', nullable: false },
            system_id: { type: 'integer', nullable: false }
        },
        primaryKey: ['id'],
        unique: ['title'],
        foreignKeys: [{ column: 'system_id', references: 't_system(id)' }]
    },
    t_scenario_status: {
        columns: {
            id: { type: 'integer', nullable: false, default: true },
            title: { type: 'text', nullable: false }
        },
        primaryKey: ['id'],
        unique: ['title']
    },
    t_scenario: {
        columns: {
            id: { type: 'integer', nullable: false, default: true },
            title: { type: 'text', nullable: false },
            status_id: { type: 'integer', nullable: true },
            feature_id: { type: 'integer', nullable: true }
        },
        primaryKey: ['id'],
        unique: ['title'],
        foreignKeys: [
            { column: 'status_id', references: 't_scenario_status(id)' },
            { column: 'feature_id', references: 't_feature(id)' }
        ]
    },
    t_scenario_system: {
        columns: {
            scenario_id: { type: 'integer', nullable: false },
            system_id: { type: 'integer', nullable: false }
        },
        primaryKey: ['scenario_id', 'system_id'],
        foreignKeys: [
            { column: 'scenario_id', references: 't_scenario(id)', onDelete: 'CASCADE' },
            { column: 'system_id', references: 't_system(id)' }
        ]
    },
    t_scenario_pre: {
        columns: {
            id: { type: 'integer', nullable: false, default: true },
            scenario_id: { type: 'integer', nullable: false },
            description: { type: 'text', nullable: false }
        },
        primaryKey: ['id'],
        foreignKeys: [
            { column: 'scenario_id', references: 't_scenario(id)', onDelete: 'CASCADE' }
        ]
    },
    t_scenario_expect: {
        columns: {
            id: { type: 'integer', nullable: false, default: true },
            scenario_id: { type: 'integer', nullable: false },
            description: { type: 'text', nullable: false }
        },
        primaryKey: ['id'],
        foreignKeys: [
            { column: 'scenario_id', references: 't_scenario(id)', onDelete: 'CASCADE' }
        ]
    }
};

// Logs coloridos
const log = {
    success: (msg) => console.log('\x1b[32m✓\x1b[0m', msg),
    error: (msg) => console.log('\x1b[31m✗\x1b[0m', msg),
    info: (msg) => console.log('\x1b[36mℹ\x1b[0m', msg),
    section: (msg) => console.log('\n\x1b[33m=====', msg, '=====\x1b[0m')
};

let client;
let passed = 0;
let failed = 0;

// Conecta ao banco
async function connect() {
    client = new Client(DB_CONFIG);
    await client.connect();
    log.success(`Conectado ao banco: ${DB_CONFIG.database}@${DB_CONFIG.host}:${DB_CONFIG.port}`);
}

// Verifica se tabela existe
async function tableExists(tableName) {
    const result = await client.query(`
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = $1
        )
    `, [tableName]);
    return result.rows[0].exists;
}

// Obtém informações das colunas
async function getColumns(tableName) {
    const result = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
    `, [tableName]);
    return result.rows;
}

// Obtém primary keys
async function getPrimaryKeys(tableName) {
    const result = await client.query(`
        SELECT a.attname as column_name
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = $1::regclass AND i.indisprimary
    `, [tableName]);
    return result.rows.map(r => r.column_name);
}

// Obtém constraints UNIQUE
async function getUniqueConstraints(tableName) {
    const result = await client.query(`
        SELECT a.attname as column_name
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = $1::regclass AND i.indisunique AND NOT i.indisprimary
    `, [tableName]);
    return result.rows.map(r => r.column_name);
}

// Obtém foreign keys
async function getForeignKeys(tableName) {
    const result = await client.query(`
        SELECT
            kcu.column_name,
            ccu.table_name AS foreign_table,
            ccu.column_name AS foreign_column,
            rc.delete_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        JOIN information_schema.referential_constraints AS rc
            ON rc.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = $1
    `, [tableName]);
    return result.rows;
}

// Valida uma tabela
async function validateTable(tableName, expected) {
    log.section(`TABELA: ${tableName}`);

    // 1. Verifica existência
    const exists = await tableExists(tableName);
    if (!exists) {
        log.error(`Tabela '${tableName}' NÃO existe`);
        failed++;
        return;
    }
    log.success(`Tabela '${tableName}' existe`);
    passed++;

    // 2. Valida colunas
    const columns = await getColumns(tableName);
    for (const [colName, colExpected] of Object.entries(expected.columns)) {
        const col = columns.find(c => c.column_name === colName);
        
        if (!col) {
            log.error(`Coluna '${colName}' não encontrada`);
            failed++;
            continue;
        }

        // Tipo
        const typeMatch = col.data_type === colExpected.type;
        if (typeMatch) {
            log.success(`${colName}: tipo '${col.data_type}'`);
            passed++;
        } else {
            log.error(`${colName}: esperado '${colExpected.type}', encontrado '${col.data_type}'`);
            failed++;
        }

        // Nullable
        const isNullable = col.is_nullable === 'YES';
        if (isNullable === colExpected.nullable) {
            log.success(`${colName}: nullable=${isNullable}`);
            passed++;
        } else {
            log.error(`${colName}: nullable esperado=${colExpected.nullable}, encontrado=${isNullable}`);
            failed++;
        }

        // Default (SERIAL)
        if (colExpected.default) {
            const hasDefault = col.column_default !== null;
            if (hasDefault) {
                log.success(`${colName}: possui default (SERIAL)`);
                passed++;
            } else {
                log.error(`${colName}: esperado default (SERIAL)`);
                failed++;
            }
        }
    }

    // 3. Valida PRIMARY KEY
    const pks = await getPrimaryKeys(tableName);
    const expectedPks = expected.primaryKey || [];
    const pkMatch = expectedPks.every(pk => pks.includes(pk)) && pks.length === expectedPks.length;
    if (pkMatch) {
        log.success(`PRIMARY KEY: [${pks.join(', ')}]`);
        passed++;
    } else {
        log.error(`PRIMARY KEY: esperado [${expectedPks.join(', ')}], encontrado [${pks.join(', ')}]`);
        failed++;
    }

    // 4. Valida UNIQUE
    if (expected.unique) {
        const uniques = await getUniqueConstraints(tableName);
        for (const uniqueCol of expected.unique) {
            if (uniques.includes(uniqueCol)) {
                log.success(`UNIQUE: '${uniqueCol}'`);
                passed++;
            } else {
                log.error(`UNIQUE: '${uniqueCol}' não encontrado`);
                failed++;
            }
        }
    }

    // 5. Valida FOREIGN KEYS
    if (expected.foreignKeys) {
        const fks = await getForeignKeys(tableName);
        for (const expectedFk of expected.foreignKeys) {
            const fk = fks.find(f => f.column_name === expectedFk.column);
            if (fk) {
                const refMatch = `${fk.foreign_table}(${fk.foreign_column})` === expectedFk.references;
                if (refMatch) {
                    log.success(`FK: ${expectedFk.column} → ${expectedFk.references}`);
                    passed++;
                } else {
                    log.error(`FK: ${expectedFk.column} referência incorreta`);
                    failed++;
                }

                // Valida ON DELETE CASCADE
                if (expectedFk.onDelete === 'CASCADE') {
                    if (fk.delete_rule === 'CASCADE') {
                        log.success(`FK: ${expectedFk.column} ON DELETE CASCADE`);
                        passed++;
                    } else {
                        log.error(`FK: ${expectedFk.column} esperado ON DELETE CASCADE`);
                        failed++;
                    }
                }
            } else {
                log.error(`FK: '${expectedFk.column}' não encontrada`);
                failed++;
            }
        }
    }
}

// Executa todos os testes
async function runTests() {
    console.log('\n╔═══════════════════════════════════════════════╗');
    console.log('║   TESTES: VALIDAÇÃO DO SCHEMA DO DATABASE     ║');
    console.log('╚═══════════════════════════════════════════════╝');

    try {
        await connect();

        for (const [tableName, schema] of Object.entries(EXPECTED_SCHEMA)) {
            await validateTable(tableName, schema);
        }

        // Resultado final
        console.log('\n╔═══════════════════════════════════════════════╗');
        console.log(`║   RESULTADO: ${passed} passed / ${failed} failed`);
        console.log('╚═══════════════════════════════════════════════╝\n');

        if (failed > 0) {
            process.exit(1);
        }
    } catch (error) {
        log.error(`Erro: ${error.message}`);
        process.exit(1);
    } finally {
        if (client) await client.end();
    }
}

runTests();

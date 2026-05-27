/**
 * ============================================================
 *  ARQUIVO: app/api/db.js
 * ============================================================
 *  Pool único do `pg` para toda a API.
 *
 *  Trocamos o `Client` antigo (qa-track <= 0.1.2) por `Pool`
 *  porque agora há fluxos transacionais (lock de device com
 *  BEGIN/FOR UPDATE/COMMIT) que precisam de uma conexão dedicada
 *  via `pool.connect()`.
 *
 *  Para queries simples, `pool.query(sql, params)` tem a mesma
 *  assinatura de `client.query()`, então as rotas legadas
 *  continuam funcionando sem alteração.
 * ============================================================
 */

const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({
    host:     config.pg.host,
    port:     config.pg.port,
    database: config.pg.database,
    user:     config.pg.user,
    password: config.pg.password,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
});

pool.on('error', (err) => {
    console.error('[pg] erro inesperado no client idle:', err.message);
});

/**
 * Aguarda Postgres responder. Usado no boot — falha fast se a
 * config estiver errada ou o Postgres não subiu.
 */
async function waitForReady(retries = 30, delayMs = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            await pool.query('SELECT 1');
            return;
        } catch (err) {
            if (i === retries - 1) throw err;
            await new Promise(r => setTimeout(r, delayMs));
        }
    }
}

module.exports = { pool, waitForReady };

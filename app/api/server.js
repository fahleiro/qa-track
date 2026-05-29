/**
 * ============================================================
 *  QA Track API — v0.4.1
 * ============================================================
 *  Bootstrap da API Express. Responsabilidades:
 *    1. Esperar Postgres ficar pronto.
 *    2. Garantir que o usuário admin existe (bcrypt do
 *       ADMIN_PASSWORD da env). Idempotente.
 *    3. Registrar middlewares globais (CORS, body-parser, JWT).
 *    4. Registrar rotas (delegado a routes/index.js).
 *    5. Iniciar cron in-process de limpeza de locks expirados.
 *    6. Iniciar o servidor HTTP.
 *
 *  Diferenças vs v0.1.x:
 *    - Pool (pg) no lugar de Client único — habilita transações
 *      via pool.connect() (ex: lock de device com FOR UPDATE).
 *    - authJwt aplicado globalmente, com whitelist de rotas
 *      públicas em middleware/authJwt.js.
 *    - errorHandler centralizado.
 * ============================================================
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const config = require('./config');
const { pool, waitForReady } = require('./db');
const authJwt = require('./middleware/authJwt');
const errorHandler = require('./middleware/errorHandler');
const registerRoutes = require('./routes');

const app = express();

// ---------- Middlewares globais ----------
app.use(cors({
    origin: [
        `http://localhost:${config.interfacePort}`,
        `http://localhost:${config.apiPort}`
    ],
    credentials: true
}));
app.use(bodyParser.json({ limit: '5mb' }));

// Health check é público (antes do JWT).
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// JWT global. A própria authJwt mantém a whitelist (login,
// nodes/register, nodes/heartbeat, health).
app.use(authJwt);

// ---------- Boot ----------
async function ensureAdminUser() {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM auth.t_user');
    if (rows[0].n > 0) return;

    const hash = await bcrypt.hash(config.adminPassword, 10);
    await pool.query(
        'INSERT INTO auth.t_user (username, password_hash, role) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING',
        [String(config.adminUsername).toLowerCase(), hash, 'admin']
    );
    console.log(`[boot] usuário admin criado: ${config.adminUsername} (senha via env ADMIN_PASSWORD)`);
}

async function init() {
    try {
        console.log('[boot] aguardando Postgres...');
        await waitForReady();
        console.log('[boot] Postgres ok');

        await ensureAdminUser();

        registerRoutes(app, pool);

        // errorHandler precisa ser o ÚLTIMO middleware
        app.use(errorHandler);

        // Cron in-process: limpa locks expirados + audita em t_farm_session.
        // Rodar dentro do processo evita cron externo no MVP. Em produção
        // com múltiplos pods, mover para pg_cron ou worker dedicado.
        setInterval(async () => {
            try {
                const r = await pool.query(`
                    WITH expired AS (
                        DELETE FROM device_farm.t_device_lock
                        WHERE expires_at < NOW()
                        RETURNING udid, user_id, locked_at
                    )
                    INSERT INTO device_farm.t_farm_session (udid, user_id, started_at, ended_at, reason_end)
                    SELECT udid, user_id, locked_at, NOW(), 'ttl_expired' FROM expired
                    RETURNING id
                `);
                if (r.rowCount > 0) console.log(`[lock-cron] ${r.rowCount} lock(s) expirado(s) → t_farm_session`);
            } catch (err) {
                console.error('[lock-cron] erro:', err.message);
            }
        }, config.lockCleanupIntervalMs);

        app.listen(config.apiPort, '0.0.0.0', () => {
            console.log(`[boot] QA Track API v0.4.1 ouvindo em :${config.apiPort}`);
            if (config.jwtSecret === 'change-me') {
                console.warn('[boot] AVISO: JWT_SECRET está com valor default — defina em produção!');
            }
        });
    } catch (err) {
        console.error('[boot] erro fatal:', err.message);
        process.exit(1);
    }
}

init();

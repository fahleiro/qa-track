/**
 * ============================================================
 *  ARQUIVO: app/api/routes/api/auth.js
 * ============================================================
 *  Endpoints de autenticação:
 *    POST /api/auth/login                  → JWT 24h
 *    GET  /api/auth/me                     → dados do usuário logado
 *    POST /api/auth/logout                 → audit (stateless, frontend descarta)
 *    POST /api/auth/generate-device-token  → gera df_token (HS256 sem expiração)
 *
 *  Notas:
 *   - JWT principal (login)  → assinado com JWT_SECRET, expira 24h.
 *   - df_token (Appium caps) → assinado com DEVICE_TOKEN_SECRET, HS256,
 *     SEM expiração. Persistido em auth.t_user.df_token. É um valor
 *     EXIBIDO ao humano (copy-to-clipboard) — não é usado nas chamadas
 *     internas da plataforma.
 * ============================================================
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../../config');

module.exports = (app, pool) => {

    app.post('/api/auth/login', async (req, res, next) => {
        try {
            const { username, password } = req.body || {};
            if (!username || !password) {
                return res.status(400).json({ error: 'username e password são obrigatórios' });
            }

            const { rows } = await pool.query(
                'SELECT id, username, password_hash, role, df_token FROM auth.t_user WHERE username = $1',
                [String(username).toLowerCase()]
            );
            const user = rows[0];
            if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

            const ok = await bcrypt.compare(password, user.password_hash);
            if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });

            const token = jwt.sign(
                { uid: user.id, username: user.username, role: user.role },
                config.jwtSecret,
                { expiresIn: config.jwtExpiresIn }
            );

            // Audit log (best-effort; falha não bloqueia login)
            pool.query(
                'INSERT INTO auth.t_session (user_id, ip, user_agent, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL \'24 hours\')',
                [user.id, req.ip, req.headers['user-agent'] || null]
            ).catch(err => console.error('[auth] falha ao inserir session log:', err.message));

            res.json({
                token,
                user: {
                    id:       user.id,
                    username: user.username,
                    role:     user.role,
                    df_token: user.df_token
                }
            });
        } catch (err) { next(err); }
    });

    app.get('/api/auth/me', async (req, res, next) => {
        try {
            const { rows } = await pool.query(
                'SELECT id, username, role, df_token, created_at FROM auth.t_user WHERE id = $1',
                [req.user.id]
            );
            if (!rows[0]) return res.status(404).json({ error: 'Usuário não encontrado' });
            res.json(rows[0]);
        } catch (err) { next(err); }
    });

    app.post('/api/auth/logout', (_req, res) => {
        res.json({ ok: true });
    });

    app.post('/api/auth/generate-device-token', async (req, res, next) => {
        try {
            const dfToken = jwt.sign(
                { username: req.user.username },
                config.deviceTokenSecret,
                { algorithm: 'HS256', noTimestamp: true }
            );
            await pool.query(
                'UPDATE auth.t_user SET df_token = $1 WHERE id = $2',
                [dfToken, req.user.id]
            );
            res.json({ df_token: dfToken });
        } catch (err) { next(err); }
    });
};

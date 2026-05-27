/**
 * ============================================================
 *  ARQUIVO: app/api/middleware/authJwt.js
 * ============================================================
 *  Middleware Express global. Verifica `Authorization: Bearer
 *  <jwt>` e popula `req.user`. Whitelist explícita para rotas
 *  públicas (login + node-agent register/heartbeat + health).
 *
 *  Nota didática: JWT é stateless — não fazemos lookup em
 *  auth.t_user a cada request. O payload do token já carrega
 *  id, username e role.
 * ============================================================
 */

const jwt = require('jsonwebtoken');
const config = require('../config');

// Rotas onde o middleware NÃO checa JWT. Conferidas como prefixo
// de path + método. Em produção, register/heartbeat poderiam ser
// protegidos por um AGENT_REGISTER_TOKEN pré-compartilhado.
const PUBLIC_PATHS = [
    { method: 'POST', path: '/api/auth/login' },
    { method: 'GET',  path: '/api/health' },
    { method: 'POST', path: '/api/nodes/register' },
    { method: 'POST', path: '/api/nodes/heartbeat' }
];

function isPublic(req) {
    return PUBLIC_PATHS.some(p =>
        p.method === req.method && req.path.startsWith(p.path)
    );
}

function authJwt(req, res, next) {
    if (isPublic(req)) return next();

    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token ausente ou formato inválido' });
    }

    const token = header.substring(7);
    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = {
            id:       decoded.uid,
            username: decoded.username,
            role:     decoded.role
        };
        return next();
    } catch (_err) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
}

module.exports = authJwt;

/**
 * ============================================================
 *  ARQUIVO: app/api/middleware/requireRole.js
 * ============================================================
 *  Factory de middleware que restringe rota a roles específicas.
 *  Usado em endpoints de admin (forçar liberação de lock,
 *  desregistrar node). Depende de authJwt já ter populado
 *  req.user.
 * ============================================================
 */

function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Permissão insuficiente' });
        }
        next();
    };
}

module.exports = requireRole;

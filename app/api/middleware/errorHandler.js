/**
 * ============================================================
 *  ARQUIVO: app/api/middleware/errorHandler.js
 * ============================================================
 *  Captura erros não-tratados (rotas chamam `next(err)` em catch)
 *  e devolve JSON amigável, traduzindo códigos comuns do Postgres.
 *
 *  Códigos pg comuns:
 *    23505 = unique_violation       → 409 Conflict
 *    23503 = foreign_key_violation  → 409 Conflict
 *    23502 = not_null_violation     → 400 Bad Request
 * ============================================================
 */

function errorHandler(err, _req, res, _next) {
    if (err && err.code) {
        switch (err.code) {
            case '23505':
                return res.status(409).json({ error: 'Já existe um registro com esse valor único', detail: err.detail });
            case '23503':
                return res.status(409).json({ error: 'Violação de chave estrangeira', detail: err.detail });
            case '23502':
                return res.status(400).json({ error: 'Campo obrigatório ausente', detail: err.column });
        }
    }
    console.error('[error]', (err && err.stack) || err);
    res.status(500).json({ error: 'Erro interno', message: err && err.message });
}

module.exports = errorHandler;

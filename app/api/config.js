/**
 * ============================================================
 *  ARQUIVO: app/api/config.js
 * ============================================================
 *  Centraliza configuração lida de env vars em um único objeto.
 *  Outros módulos importam daqui em vez de ler `process.env`
 *  espalhadamente.
 * ============================================================
 */

module.exports = {
    // --- HTTP ---
    apiPort:       parseInt(process.env.PORT || process.env.P_API || '3000', 10),
    interfacePort: parseInt(process.env.P_INTERFACE || '5173', 10),

    // --- Postgres ---
    pg: {
        host:     process.env.POSTGRES_HOST     || 'localhost',
        port:     parseInt(process.env.P_POSTGRES || '5432', 10),
        database: process.env.POSTGRES_DATABASE || 'qa_test_track',
        user:     process.env.POSTGRES_USER     || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres'
    },

    // --- Auth ---
    jwtSecret:         process.env.JWT_SECRET          || 'change-me',
    deviceTokenSecret: process.env.DEVICE_TOKEN_SECRET || 'change-me-too',
    jwtExpiresIn:      '24h',

    // Bootstrap admin (criado em runtime na primeira boot, se a
    // tabela auth.t_user estiver vazia — ver server.js#ensureAdminUser).
    adminUsername: process.env.ADMIN_USERNAME || 'admin',
    adminPassword: process.env.ADMIN_PASSWORD || 'admin',

    // --- Device Farm ---
    deviceLockTtlSeconds:    5 * 60,
    lockCleanupIntervalMs:   60 * 1000,
    nodeFetchTimeoutMs:      3000,
    nodeOnlineWindowSeconds: 60
};

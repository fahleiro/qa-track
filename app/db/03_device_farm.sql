-- ============================================================
--  03_device_farm.sql
-- ============================================================
--  Schema `device_farm` — registry de nodes, devices e locks.
--  Source of truth do farm vive no Postgres do dashboard; os
--  node-agents são stateless e apenas executam ADB localmente.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS device_farm;

-- t_node — cada máquina rodando node-agent. Online = last_heartbeat < 60s.
CREATE TABLE IF NOT EXISTS device_farm.t_node (
    id             SERIAL PRIMARY KEY,
    name           TEXT NOT NULL UNIQUE,
    public_url     TEXT NOT NULL,
    last_heartbeat TIMESTAMP,
    registered_at  TIMESTAMP DEFAULT NOW(),
    version        TEXT
);

-- t_device — cache do último snapshot por UDID. Atualizado a cada heartbeat.
--   platform : 'android' no MVP. Coluna pronta para 'ios' no futuro.
CREATE TABLE IF NOT EXISTS device_farm.t_device (
    udid          TEXT PRIMARY KEY,
    node_id       INTEGER REFERENCES device_farm.t_node(id) ON DELETE CASCADE,
    platform      TEXT NOT NULL DEFAULT 'android',
    model         TEXT,
    manufacturer  TEXT,
    os_version    TEXT,
    last_status   TEXT,
    last_seen     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_node ON device_farm.t_device(node_id);

-- t_device_lock — 1 lock ativo por device (UNIQUE udid).
--   expires_at  : TTL curto (5 min default) renovado por keepalive.
--                 Cron in-process limpa locks expirados a cada 60s.
CREATE TABLE IF NOT EXISTS device_farm.t_device_lock (
    id          SERIAL PRIMARY KEY,
    udid        TEXT NOT NULL UNIQUE REFERENCES device_farm.t_device(udid) ON DELETE CASCADE,
    user_id     INTEGER NOT NULL REFERENCES auth.t_user(id),
    session_id  TEXT,
    locked_at   TIMESTAMP DEFAULT NOW(),
    expires_at  TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lock_expires ON device_farm.t_device_lock(expires_at);

-- t_farm_session — audit log de uso. Quando lock é liberado (manual /
-- TTL / admin force), o registro vai pra cá para histórico.
CREATE TABLE IF NOT EXISTS device_farm.t_farm_session (
    id         SERIAL PRIMARY KEY,
    udid       TEXT NOT NULL,
    user_id    INTEGER REFERENCES auth.t_user(id),
    started_at TIMESTAMP NOT NULL,
    ended_at   TIMESTAMP NOT NULL,
    reason_end TEXT   -- 'manual_release' | 'ttl_expired' | 'admin_force'
);

-- t_apk — placeholder para upload futuro (parity com plugins de farm).
-- Sem endpoint no MVP, schema preparado.
CREATE TABLE IF NOT EXISTS device_farm.t_apk (
    id          SERIAL PRIMARY KEY,
    filename    TEXT NOT NULL,
    uploaded_by INTEGER REFERENCES auth.t_user(id),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    size_bytes  BIGINT
);

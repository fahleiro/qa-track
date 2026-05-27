-- ============================================================
--  02_auth.sql
-- ============================================================
--  Schema `auth` — credenciais e sessões da plataforma.
--
--  ATENÇÃO: tabelas do qa-track (t_system, t_feature, …) continuam
--  no schema `public` para preservar compatibilidade com versões
--  anteriores. Apenas as novidades de auth + device farm vivem em
--  schemas dedicados.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS auth;

-- t_user — usuário da plataforma.
--   role     : 'admin' | 'user'. No bootstrap só admin existe (criado
--              em runtime via bcrypt — ver api/server.js).
--   df_token : JWT HS256 sem expiração, gerado on-demand para uso
--              em capabilities Appium futuras. Persistido aqui para
--              o usuário recuperar entre sessões.
CREATE TABLE IF NOT EXISTS auth.t_user (
    id            SERIAL PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'user',
    df_token      TEXT,
    created_at    TIMESTAMP DEFAULT NOW()
);

-- t_session — audit log de logins. JWT é stateless; este registro
-- existe apenas para governança (rastrear quem logou de onde/quando).
CREATE TABLE IF NOT EXISTS auth.t_session (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER REFERENCES auth.t_user(id) ON DELETE CASCADE,
    ip         TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_session_user ON auth.t_session(user_id);

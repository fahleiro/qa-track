-- Tabela de Sistemas
CREATE TABLE IF NOT EXISTS t_system (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL UNIQUE
);

-- Tabela de Funcionalidades
CREATE TABLE IF NOT EXISTS t_feature (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL UNIQUE,    
    system_id INTEGER REFERENCES t_system(id) NOT NULL
);

-- Tabela de Status de Cenários
CREATE TABLE IF NOT EXISTS t_scenario_status (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL UNIQUE
);

INSERT INTO t_scenario_status (title) VALUES
    ('Ativo'),
    ('Obsoleto')
ON CONFLICT (title) DO NOTHING;

-- Tabela de Cenários
CREATE TABLE IF NOT EXISTS t_scenario (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL UNIQUE,
    status_id INTEGER REFERENCES t_scenario_status(id),
    feature_id INTEGER REFERENCES t_feature(id)
);

-- Tabela de Relacionamento Cenário-Sistema (N:N)
CREATE TABLE IF NOT EXISTS t_scenario_system (
    scenario_id INTEGER REFERENCES t_scenario(id) ON DELETE CASCADE,
    system_id INTEGER REFERENCES t_system(id),
    PRIMARY KEY(scenario_id, system_id)
);

-- Tabela de Pré-requisitos de Cenários
CREATE TABLE IF NOT EXISTS t_scenario_pre (
    id SERIAL PRIMARY KEY,
    scenario_id INTEGER NOT NULL REFERENCES t_scenario(id) ON DELETE CASCADE,
    description TEXT NOT NULL
);

-- Tabela de Resultados Esperados de Cenários
CREATE TABLE IF NOT EXISTS t_scenario_expect (
    id SERIAL PRIMARY KEY,
    scenario_id INTEGER NOT NULL REFERENCES t_scenario(id) ON DELETE CASCADE,
    description TEXT NOT NULL
);

-- Tabela de Status de Resultado de Execução (usado em t_run_detail)
CREATE TABLE IF NOT EXISTS t_result_status (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL UNIQUE
);

INSERT INTO t_result_status (title) VALUES
    ('Planned'),
    ('Testing'),
    ('Passed'),
    ('Failed')
ON CONFLICT (title) DO NOTHING;

-- Tabela de Status de Run (fixo, não customizável)
CREATE TABLE IF NOT EXISTS t_run_status (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL UNIQUE
);

INSERT INTO t_run_status (title) VALUES
    ('Planned'),
    ('Running'),
    ('Closed')
ON CONFLICT (title) DO NOTHING;

-- Tabela de Etapas do Kanban (fixo, seedado)
CREATE TABLE IF NOT EXISTS t_card_status (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL UNIQUE,
    "order" INT NOT NULL,
    triggers_run_status_id INTEGER REFERENCES t_run_status(id)
);

INSERT INTO t_card_status (title, "order", triggers_run_status_id) VALUES
    ('Backlog',            1, NULL),
    ('Em desenvolvimento', 2, NULL),
    ('Em testes',          3, (SELECT id FROM t_run_status WHERE title = 'Running')),
    ('Finalizado',         4, (SELECT id FROM t_run_status WHERE title = 'Closed'))
ON CONFLICT (title) DO NOTHING;

-- Tabela principal de Runs (card_id adicionado via ALTER após criação de t_card)
CREATE TABLE IF NOT EXISTS t_run_master (
    id         SERIAL PRIMARY KEY,
    title      TEXT NOT NULL,
    start_date DATE,
    end_date   DATE,
    status_id  INTEGER REFERENCES t_run_status(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Cards do Kanban
CREATE TABLE IF NOT EXISTS t_card (
    id             SERIAL PRIMARY KEY,
    title          TEXT NOT NULL,
    description    TEXT,
    system_id      INTEGER REFERENCES t_system(id) NOT NULL,
    feature_id     INTEGER REFERENCES t_feature(id) NOT NULL,
    card_status_id INTEGER REFERENCES t_card_status(id),
    run_id         INTEGER REFERENCES t_run_master(id),
    created_at     TIMESTAMP DEFAULT NOW()
);

-- Referência circular: card_id em t_run_master (adicionada após t_card existir)
ALTER TABLE t_run_master ADD COLUMN IF NOT EXISTS card_id INTEGER REFERENCES t_card(id);

-- Tabela de Detalhe de Run (cenários associados a uma run)
CREATE TABLE IF NOT EXISTS t_run_detail (
    id               SERIAL PRIMARY KEY,
    run_id           INTEGER REFERENCES t_run_master(id) ON DELETE CASCADE,
    scenario_id      INTEGER REFERENCES t_scenario(id),
    result_status_id INTEGER REFERENCES t_result_status(id)
);
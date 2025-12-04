-- ====================================
-- CRIAÇÃO DAS TABELAS DO SISTEMA
-- ====================================


-- Tabela de Status de Resultado
CREATE TABLE IF NOT EXISTS t_result_status (
    id SERIAL PRIMARY KEY,
    title VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE
);

-- Tabela de Status de Execuções
CREATE TABLE IF NOT EXISTS t_run_status (
    id SERIAL PRIMARY KEY,
    title VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE
);

-- Tabela de Pastas (Suites)
CREATE TABLE IF NOT EXISTS t_suite (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL UNIQUE,
    description TEXT
);



-- Tabela de Execuções (Runs)
CREATE TABLE IF NOT EXISTS t_run (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    status INTEGER REFERENCES t_run_status(id) ON DELETE SET NULL
);

-- Tabela de Detalhes da Execução
CREATE TABLE IF NOT EXISTS t_run_detail (
    run_id INTEGER REFERENCES t_run(id) ON DELETE CASCADE,
    scenario_id INTEGER REFERENCES t_scenario(id) ON DELETE CASCADE,
    PRIMARY KEY(run_id, scenario_id)
);

-- Tabela de Resultados (Results)
CREATE TABLE IF NOT EXISTS t_result (
    id SERIAL PRIMARY KEY,
    scenario_id INTEGER REFERENCES t_scenario(id) ON DELETE CASCADE,
    run_id INTEGER REFERENCES t_run(id) ON DELETE CASCADE,
    status INTEGER REFERENCES t_result_status(id) ON DELETE SET NULL
);

-- Tabela de Sistemas
CREATE TABLE IF NOT EXISTS t_system (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL UNIQUE
);


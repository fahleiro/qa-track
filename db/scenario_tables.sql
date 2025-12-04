-- Tabela de Status de Cenários
CREATE TABLE IF NOT EXISTS t_scenario_status (
    id SERIAL PRIMARY KEY,
    title VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE
);

-- Tabela de Cenários
CREATE TABLE IF NOT EXISTS t_scenario (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL UNIQUE,
    suite_id INTEGER REFERENCES t_suite(id) ON DELETE SET NULL,
    status_id INTEGER REFERENCES t_scenario_status(id) ON DELETE SET NULL
);

-- Tabela de Relacionamento Cenário-Sistema (N:N)
CREATE TABLE IF NOT EXISTS t_scenario_system (
    scenario_id INTEGER REFERENCES t_scenario(id) ON DELETE CASCADE,
    system_id INTEGER REFERENCES t_system(id) ON DELETE CASCADE,
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
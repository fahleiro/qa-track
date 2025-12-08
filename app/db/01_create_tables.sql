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
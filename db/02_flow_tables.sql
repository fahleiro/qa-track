-- ====================================
-- CRIAÇÃO DAS TABELAS DE FLOW
-- ====================================

-- Tabela de Flows
CREATE TABLE IF NOT EXISTS t_flow (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL UNIQUE
);

-- Tabela de Detalhes do Flow (cenários vinculados com posição sequencial)
CREATE TABLE IF NOT EXISTS t_flow_detail (
    id SERIAL PRIMARY KEY,
    flow_id INTEGER REFERENCES t_flow(id) ON DELETE CASCADE,
    scenario_id INTEGER REFERENCES t_scenario(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 1,
    UNIQUE(flow_id, scenario_id),
    UNIQUE(flow_id, position)
);

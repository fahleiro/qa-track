-- Migração: Pré-requisitos e Resultados Esperados como tabelas separadas
-- Data: 2025-12-04

-- 1. Criar tabelas de pré-requisitos e resultados esperados
CREATE TABLE IF NOT EXISTS t_scenario_pre (
    id SERIAL PRIMARY KEY,
    scenario_id INTEGER NOT NULL REFERENCES t_scenario(id) ON DELETE CASCADE,
    description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS t_scenario_expect (
    id SERIAL PRIMARY KEY,
    scenario_id INTEGER NOT NULL REFERENCES t_scenario(id) ON DELETE CASCADE,
    description TEXT NOT NULL
);

-- 2. Migrar dados existentes (se houver)
INSERT INTO t_scenario_pre (scenario_id, description)
SELECT id, pre FROM t_scenario WHERE pre IS NOT NULL AND pre != '';

INSERT INTO t_scenario_expect (scenario_id, description)
SELECT id, expec FROM t_scenario WHERE expec IS NOT NULL AND expec != '';

-- 3. Remover colunas antigas de t_scenario
ALTER TABLE t_scenario DROP COLUMN IF EXISTS pre;
ALTER TABLE t_scenario DROP COLUMN IF EXISTS expec;



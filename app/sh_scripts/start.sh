#!/bin/bash
set -e

# Obtém o diretório onde este script está localizado
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "--- Executando configuração do Postgres ---"
# Executa a configuração do Postgres
"$SCRIPT_DIR/01_postgres_config.sh"

echo "--- Configurando Database ---"
# Executa a configuração do database (criação de tabelas)
"$SCRIPT_DIR/02_database_config.sh"

echo "--- Iniciando API (Node.js) ---"
cd "$(dirname "$SCRIPT_DIR")/api"
npm start &

echo "--- Iniciando Interface (React + Vite) ---"
cd "$(dirname "$SCRIPT_DIR")/interface"
npm run dev -- --host 0.0.0.0 &

# Aguarda ambos os processos
wait


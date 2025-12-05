#!/bin/bash
set -e

echo "========================================"
echo "  QA Track v0.1.0 - Iniciando..."
echo "========================================"

# Obtém o diretório onde este script está localizado
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "[1/3] Configurando Postgres..."
"$SCRIPT_DIR/01_postgres_config.sh"

echo ""
echo "[2/3] Configurando Database..."
"$SCRIPT_DIR/02_database_config.sh"

echo ""
echo "[3/3] Iniciando aplicação..."

# Inicia API
echo "--- Iniciando API (porta 3000) ---"
cd "$(dirname "$SCRIPT_DIR")/api"
npm start &
API_PID=$!

# Aguarda API subir
sleep 3

# Inicia Interface
echo "--- Iniciando Interface (porta 5173) ---"
cd "$(dirname "$SCRIPT_DIR")/interface"
npm run dev -- --host 0.0.0.0 &
UI_PID=$!

echo ""
echo "========================================"
echo "  QA Track v0.1.0 - Pronto!"
echo "  API:       http://localhost:3000"
echo "  Interface: http://localhost:5173"
echo "========================================"

# Aguarda ambos os processos
wait $API_PID $UI_PID

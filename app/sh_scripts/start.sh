#!/bin/bash
set -e

echo "========================================"
echo "  QA Track v0.1.0 - Iniciando..."
echo "========================================"

# Obtém o diretório onde este script está localizado
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Portas configuráveis via variáveis de ambiente
API_PORT="${P_API:-3000}"
INTERFACE_PORT="${P_INTERFACE:-5173}"

echo ""
echo "[1/3] Configurando Postgres..."
"$SCRIPT_DIR/01_postgres_config.sh"

echo ""
echo "[2/3] Configurando Database..."
"$SCRIPT_DIR/02_database_config.sh"

echo ""
echo "[3/3] Iniciando aplicação..."

# Inicia API
echo "--- Iniciando API (porta $API_PORT) ---"
cd "$(dirname "$SCRIPT_DIR")/api"
PORT=$API_PORT npm start &
API_PID=$!

# Aguarda API subir
sleep 3

# Inicia Interface
echo "--- Iniciando Interface (porta $INTERFACE_PORT) ---"
cd "$(dirname "$SCRIPT_DIR")/interface"
npm run dev -- --host 0.0.0.0 --port $INTERFACE_PORT &
UI_PID=$!

echo ""
echo "========================================"
echo "  QA Track v0.1.0 - Pronto!"
echo "  API:       http://localhost:$API_PORT"
echo "  Interface: http://localhost:$INTERFACE_PORT"
echo "========================================"

# Aguarda ambos os processos
wait $API_PID $UI_PID

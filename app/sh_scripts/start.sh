#!/bin/bash
set -e

echo "========================================"
echo "  QA Track v0.1.0 - Starting..."
echo "========================================"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Configurable ports via environment variables
API_PORT="${P_API:-3000}"
INTERFACE_PORT="${P_INTERFACE:-5173}"
POSTGRES_PORT="${P_POSTGRES:-5432}"

echo ""
echo "[1/3] Configuring Postgres..."
"$SCRIPT_DIR/01_postgres_config.sh"

echo ""
echo "[2/3] Configuring Database..."
"$SCRIPT_DIR/02_database_config.sh"

echo ""
echo "[3/3] Starting application..."

# Starting API
echo "--- Starting API (port $API_PORT) ---"
cd "$(dirname "$SCRIPT_DIR")/api"
PORT=$API_PORT npm start &
API_PID=$!

# Wait for API to start
sleep 3

# Starting Interface
echo "--- Starting Interface (port $INTERFACE_PORT) ---"
cd "$(dirname "$SCRIPT_DIR")/interface"
npm run dev -- --host 0.0.0.0 --port $INTERFACE_PORT &
UI_PID=$!

echo ""
echo "========================================"
echo "  QA Track v0.1.0 - Ready!"
echo "  API:       http://localhost:$API_PORT"
echo "  Interface: http://localhost:$INTERFACE_PORT"
echo "  Postgres:  port $POSTGRES_PORT"
echo "========================================"

# Wait for both processes
wait $API_PID $UI_PID

#!/bin/bash
set -e

echo "=== Configuring Database (Creating Tables) ==="

# Configurable port via environment variable
POSTGRES_PORT="${P_POSTGRES:-5432}"

# Wait for Postgres to be fully available
sleep 2

# SQL scripts directory
SQL_DIR="/app/db"

# Execute script to create tables
echo "--- Creating tables ---"
su - postgres -c "psql -p $POSTGRES_PORT -d qa_test_track -f $SQL_DIR/01_create_tables.sql"

echo "=== Database configured successfully ==="

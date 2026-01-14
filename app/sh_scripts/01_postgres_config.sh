#!/bin/bash
set -e

echo "=== Configuring Local Postgres ==="

# Configurable port via environment variable
POSTGRES_PORT="${P_POSTGRES:-5432}"

# Create data directory if it doesn't exist
if [ ! -d "/var/lib/postgresql/data/base" ]; then
    echo "--- Initializing database ---"
    mkdir -p /var/lib/postgresql/data
    chown -R postgres:postgres /var/lib/postgresql
    
    # Initialize database
    su - postgres -c "/usr/lib/postgresql/13/bin/initdb -D /var/lib/postgresql/data"
    
    # Configure to accept local connections without password (trust)
    echo "host all all 0.0.0.0/0 trust" >> /var/lib/postgresql/data/pg_hba.conf
    echo "listen_addresses='*'" >> /var/lib/postgresql/data/postgresql.conf
    echo "port=$POSTGRES_PORT" >> /var/lib/postgresql/data/postgresql.conf
fi

# Start Postgres in background
echo "--- Starting Postgres (port $POSTGRES_PORT) ---"
su - postgres -c "/usr/lib/postgresql/13/bin/pg_ctl -D /var/lib/postgresql/data -l /var/lib/postgresql/logfile start"

# Wait for Postgres to start
echo "--- Waiting for Postgres to start ---"
sleep 3

# Create application database if it doesn't exist
echo "--- Creating Database ---"
su - postgres -c "psql -p $POSTGRES_PORT -c \"CREATE DATABASE qa_test_track;\"" 2>/dev/null || echo "Database already exists"

echo "=== Postgres configured successfully (port $POSTGRES_PORT) ==="

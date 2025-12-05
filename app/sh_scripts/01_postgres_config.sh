#!/bin/bash
set -e

echo "=== Configurando Postgres Local ==="

# Cria diretório de dados se não existir
if [ ! -d "/var/lib/postgresql/data/base" ]; then
    echo "--- Inicializando banco de dados ---"
    mkdir -p /var/lib/postgresql/data
    chown -R postgres:postgres /var/lib/postgresql
    
    # Inicializa o banco
    su - postgres -c "/usr/lib/postgresql/13/bin/initdb -D /var/lib/postgresql/data"
    
    # Configura para aceitar conexões locais sem senha (trust)
    echo "host all all 0.0.0.0/0 trust" >> /var/lib/postgresql/data/pg_hba.conf
    echo "listen_addresses='*'" >> /var/lib/postgresql/data/postgresql.conf
fi

# Inicia o Postgres em background
echo "--- Iniciando Postgres ---"
su - postgres -c "/usr/lib/postgresql/13/bin/pg_ctl -D /var/lib/postgresql/data -l /var/lib/postgresql/logfile start"

# Espera o Postgres subir
echo "--- Aguardando Postgres iniciar ---"
sleep 3

# Cria banco da aplicação se não existir
echo "--- Criando Database ---"
su - postgres -c "psql -c \"CREATE DATABASE qa_test_track;\"" 2>/dev/null || echo "Database já existe"

echo "=== Postgres configurado com sucesso ==="

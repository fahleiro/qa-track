#!/bin/bash
set -e

echo "=== Configurando Database (Criando Tabelas) ==="

# Porta configurável via variável de ambiente
POSTGRES_PORT="${P_POSTGRES:-5432}"

# Espera o Postgres estar totalmente disponível
sleep 2

# Diretório dos scripts SQL
SQL_DIR="/app/db"

# Executa script de criação de tabelas
echo "--- Criando tabelas ---"
su - postgres -c "psql -p $POSTGRES_PORT -d qa_test_track -f $SQL_DIR/01_create_tables.sql"

echo "=== Database configurado com sucesso ==="

#!/bin/bash
set -e

echo "--- Configurando Database (Criando Tabelas e Seed Data) ---"

# Espera o Postgres estar totalmente disponível
sleep 2

# Diretório dos scripts SQL
SQL_DIR="/app/db"

# Executa script de criação de tabelas
echo "--- Criando tabelas ---"
su - postgres -c "psql -d mvpdb -f $SQL_DIR/01_create_tables.sql"
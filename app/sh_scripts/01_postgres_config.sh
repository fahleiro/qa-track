echo "--- Configurando Postgres Local ---"

# Cria diretório de dados se não existir
if [ ! -d "/var/lib/postgresql/data/base" ]; then
    mkdir -p /var/lib/postgresql/data
    chown -R postgres:postgres /var/lib/postgresql
    # Inicializa o banco
    su - postgres -c "/usr/lib/postgresql/13/bin/initdb -D /var/lib/postgresql/data"
    
    # Configura para aceitar conexões locais sem senha (trust)
    echo "host all  all    0.0.0.0/0  trust" >> /var/lib/postgresql/data/pg_hba.conf
    echo "listen_addresses='*'" >> /var/lib/postgresql/data/postgresql.conf
fi

# Inicia o Postgres em background
echo "--- Iniciando Postgres ---"
su - postgres -c "/usr/lib/postgresql/13/bin/pg_ctl -D /var/lib/postgresql/data -l logfile start"

# Espera o Postgres subir
sleep 3

# Cria usuário e banco da aplicação se não existirem
echo "--- Criando User e DB ---"
su - postgres -c "psql -c \"CREATE USER postgres WITH SUPERUSER PASSWORD 'postgres';\"" || true
su - postgres -c "psql -c \"CREATE DATABASE qa_test_track OWNER postgres;\"" || true

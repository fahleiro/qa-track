# ========================================
# QA Track v0.1.0 - Dockerfile
# ========================================

# Imagem base com Node.js e Debian
FROM node:18-bullseye-slim

# Instala Postgres 13 e utilitários
RUN apt-get update && apt-get install -y \
    postgresql-13 \
    postgresql-client-13 \
    dos2unix \
    && rm -rf /var/lib/apt/lists/*

# Define diretório de trabalho
WORKDIR /app

# Copia package.json primeiro (para cache de dependências)
COPY api/package.json ./api/
COPY interface/package.json ./interface/

# Instala dependências da API
WORKDIR /app/api
RUN npm install

# Instala dependências da Interface
WORKDIR /app/interface
RUN npm install

# Volta para o diretório raiz
WORKDIR /app

# Copia todo o código-fonte
COPY api/ ./api/
COPY interface/ ./interface/
COPY db/ ./db/
COPY sh_scripts/ ./sh_scripts/

# Converte line endings CRLF → LF (Windows → Unix)
RUN dos2unix sh_scripts/*.sh

# Permissões de execução para os scripts
RUN chmod +x sh_scripts/*.sh

# Variáveis de ambiente para portas (configuráveis via CLI)
ENV P_API=3000
ENV P_INTERFACE=5173
ENV P_POSTGRES=5432

# Expõe portas
EXPOSE ${P_API} ${P_INTERFACE} ${P_POSTGRES}

# Comando de entrada
CMD ["./sh_scripts/start.sh"]

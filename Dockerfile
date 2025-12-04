# Usa uma imagem base Debian (bullseye) que facilita instalar o Postgres oficial
FROM node:18-bullseye-slim

# Instala Postgres, dos2unix e dependências necessárias
RUN apt-get update && apt-get install -y \
    postgresql-13 \
    postgresql-client-13 \
    dos2unix \
    && rm -rf /var/lib/apt/lists/*

# Define diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependência e instala pacotes npm
COPY api/package.json ./api/
COPY interface/package.json ./interface/

# Instala dependências da api
WORKDIR /app/api
RUN npm install

# Instala dependências da interface
WORKDIR /app/interface
RUN npm install

# Volta para o diretório raiz
WORKDIR /app

# Copia todo o código-fonte do projeto
COPY api/ ./api/
COPY interface/ ./interface/
COPY db/ ./db/
COPY sh_scripts/ ./sh_scripts/

# Converte line endings dos scripts de Windows (CRLF) para Unix (LF)
RUN dos2unix sh_scripts/*.sh

# Dá permissão de execução para os scripts
RUN chmod +x sh_scripts/*.sh

# Expõe as portas (3000 para api, 5173 para interface)
EXPOSE 3000 5173

# Define o comando de entrada
CMD ["./sh_scripts/start.sh"]

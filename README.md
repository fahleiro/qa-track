# QA Track
_Gerenciamento de Qualidade de Software_

## 🏗️ Arquitetura

- **Backend**: Node.js + Express + PostgreSQL (porta 3000)
- **Frontend**: React + Vite (porta 5173)
- **Database**: PostgreSQL 13 (porta 5432, local no container)

## 📁 Estrutura do Projeto

```
qa-test-track/
├── backend/                    # API Node.js/Express
│   ├── server.js              # Servidor Express
│   ├── package.json
│   └── sh_scripts/            # Scripts de inicialização do DB
│       ├── 01_postgres_config.sh
│       └── 02_database_config.sh
│
├── frontend/                   # Aplicação React
│   ├── src/
│   │   ├── App.jsx            # Componente principal
│   │   ├── main.jsx           # Entry point
│   │   ├── pages/             # Páginas da aplicação
│   │   │   ├── Home.jsx
│   │   │   └── Config.jsx
│   │   ├── services/          # Serviços de API
│   │   │   └── api.js
│   │   └── styles/            # Estilos CSS
│   │       └── App.css
│   ├── package.json
│   └── vite.config.js
│
├── Dockerfile                  # Container único para ambos
├── start-services.sh           # Script de inicialização
└── README.md
```

## 🚀 Como Executar

### Com Docker (Recomendado)

```bash
# Build da imagem
docker build -t qa-test-track ./app --no-cache

# Executar container
docker run -p 3000:3000 -p 5173:5173 qa-test-track
```

Acesse:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api

### Portas Personalizadas via CLI

As portas podem ser configuradas via variáveis de ambiente:

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `P_API` | Porta da API | 3000 |
| `P_INTERFACE` | Porta da Interface | 5173 |
| `P_POSTGRES` | Porta do PostgreSQL | 5432 |

```bash
# Exemplo com portas personalizadas
docker run -p 3001:3001 -p 5174:5174 -p 5433:5433 \
  -e P_API=3001 \
  -e P_INTERFACE=5174 \
  -e P_POSTGRES=5433 \
  qa-test-track
```

## Desenvolvimento

### Database
- Windows
`Get-Content db\01_create_tables.sql | docker exec -i postgres psql -U postgres -d qa_test_track`
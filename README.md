# QA Track

QA Track is a Software Quality Management System (SQMS) for organizing and tracking test scenarios across systems, features, and execution runs.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + React Router v6 + Vite |
| Backend | Node.js + Express 4 |
| Database | PostgreSQL |
| Container | Docker |

## Features

- **Systems** — register and manage the systems under test
- **Features** — link features to systems
- **Scenarios** — create test scenarios with preconditions, expected results, and N:N system associations
- **Config** — manage custom scenario statuses; export and import the full database

## Getting Started

### Docker Compose (recomendado)

Publica as três portas no host e persiste o Postgres em volume nomeado:

```bash
cd app
docker compose up -d --build
```

### Docker (manual)

```bash
cd app
docker build -t qa-track .
docker run -p 3000:3000 -p 5173:5173 -p 5432:5432 qa-track
```

Once running:
- **UI**: http://localhost:5173
- **API**: http://localhost:3000/api
- **PostgreSQL**: `localhost:5432`

### Conexão direta ao banco

A 5432 é exposta para clientes externos (DBeaver/pgAdmin). O `pg_hba` está em modo
`trust` (sem senha) — adequado para dev local, **não usar exposto em produção**:

| Campo | Valor |
|-------|-------|
| Host | `localhost` |
| Port | `5432` |
| Database | `qa_test_track` |
| User | `postgres` |
| Password | *(vazio — trust)* |

### Port Configuration

Override default ports via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `P_API` | `3000` | API port |
| `P_INTERFACE` | `5173` | Frontend port |
| `P_POSTGRES` | `5432` | PostgreSQL port |

```bash
docker run \
  -p 3001:3001 -p 5174:5174 -p 5433:5433 \
  -e P_API=3001 -e P_INTERFACE=5174 -e P_POSTGRES=5433 \
  qa-track
```

## API

Full API reference is documented in [`docs/version/v010.md`](docs/version/v010.md).

Base URL: `http://localhost:3000/api`

Main resources: `/system`, `/feature`, `/scenario`, `/config/status/scenario`, `/config/export`, `/config/import`

## Documentation

| Document | Description |
|----------|-------------|
| [`docs/db/DATABASE.md`](docs/db/DATABASE.md) | Database overview and relationships |
| [`docs/db/TABLES.md`](docs/db/TABLES.md) | Table schemas and column definitions |
| [`docs/version/v010.md`](docs/version/v010.md) | v0.1.0 release — features and API reference |
| [`docs/version/v011.md`](docs/version/v011.md) | v0.1.1 release — multi-impact kanban cards + feature filter |
| [`docs/version/v012.md`](docs/version/v012.md) | v0.1.2 release — block result edits on closed runs |
| [`docs/version/v020.md`](docs/version/v020.md) | v0.2.0 release — JWT auth + Device Farm (node-agent) |
| [`docs/version/v021.md`](docs/version/v021.md) | v0.2.1 release — Postgres exposto no host + docker-compose |
| [`docs/version/v030.md`](docs/version/v030.md) | v0.3.0 release — Device Farm: visualização web + iOS no Linux |
| [`docs/version/v040.md`](docs/version/v040.md) | v0.4.0 release — Gravador de interações (POC nativo Android/iOS) |
| [`docs/device-farm.md`](docs/device-farm.md) | Device Farm — arquitetura hub-and-spoke, fluxos e endpoints |

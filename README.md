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
- **Scenarios** — create test scenarios with preconditions, expected results, and status
- **Runs** — group scenarios into execution runs and track results per scenario
- **Config** — manage custom statuses for scenarios and runs

## Getting Started

### Docker

```bash
cd app
docker build -t qa-track .
docker run -p 3000:3000 -p 5173:5173 qa-track
```

Once running:
- **UI**: http://localhost:5173
- **API**: http://localhost:3000/api

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

Main resources: `/system`, `/feature`, `/scenario`, `/suite`, `/run`, `/result`, `/config/status/scenario`, `/config/status/run`

## Documentation

| Document | Description |
|----------|-------------|
| [`docs/db/DATABASE.md`](docs/db/DATABASE.md) | Database overview and relationships |
| [`docs/db/TABLES.md`](docs/db/TABLES.md) | Table schemas and column definitions |
| [`docs/version/v010.md`](docs/version/v010.md) | v0.1.0 release — features and API reference |

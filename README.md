# QA Track
QA Track is a Software Quality Management System (SQMS).

## 🏗️ Architecture

- **Backend**: Node.js
- **Frontend**: React
- **Database**: PostgreSQL

## 📃 Features
- Systems create
- Features create
- Scenarios status create
- Scenarios create
- Scenario pre-conditions
- Scenarios result expected
- Relations between SYSTEMS x FEATURES x SCENARIOS STATUS x SCENARIOS x PRE CONDITIONS x RESULT EXPEXTED


## 🚪 Port Configuration
You can override the default ports by passing environment variables when running the container.

| Variable       | Default | Description |
|----------------|---------|-------------|
| `P_API`        | 3000    | API Port    |
| `P_INTERFACE`  | 5173    | Client Port |
| `P_POSTGRES`   | 5432    | Database Port|

## 🐋 Docker Usage
Run the application using the commands below.

```bash
# Example with custom ports 
docker run  -p 3001:3001  -p 5174:5174  -p 5433:5433  -e P_API=3001  -e P_INTERFACE=5174  -e P_POSTGRES=5433  qa-track
```

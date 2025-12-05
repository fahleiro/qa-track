# Tabelas
> Documentação das tabelas QA Track DB - v0.1.0

---

## t_system
> Gerencia os sistemas aos quais os cenários e funcionalidades fazem parte.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| id | SERIAL | PK | Identificador único do sistema |
| title | TEXT | NOT NULL, UNIQUE | Nome único do sistema |

---

## t_feature
> Gerencia as funcionalidades vinculadas a um sistema.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| id | SERIAL | PK | Identificador único da funcionalidade |
| title | TEXT | NOT NULL, UNIQUE | Nome único da funcionalidade |
| system_id | INTEGER | FK → t_system(id), NOT NULL | Sistema ao qual a funcionalidade pertence |

---

## t_scenario_status
> Status possíveis para cenários de teste.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| id | SERIAL | PK | Identificador único do status |
| title | TEXT | NOT NULL, UNIQUE | Nome único do status (ex: Ativo, Inativo, Obsoleto) |

---

## t_scenario
> Cenários de teste cadastrados no sistema.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| id | SERIAL | PK | Identificador único do cenário |
| title | TEXT | NOT NULL, UNIQUE | Título único do cenário |
| status_id | INTEGER | FK → t_scenario_status(id) | Status atual do cenário |
| feature_id | INTEGER | FK → t_feature(id) | Funcionalidade vinculada ao cenário |

---

## t_scenario_system
> Tabela de relacionamento N:N entre cenários e sistemas.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| scenario_id | INTEGER | FK → t_scenario(id), PK | Cenário vinculado |
| system_id | INTEGER | FK → t_system(id), PK | Sistema vinculado |

---

## t_scenario_pre
> Pré-requisitos de cenários de teste.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| id | SERIAL | PK | Identificador único do pré-requisito |
| scenario_id | INTEGER | FK → t_scenario(id), NOT NULL | Cenário ao qual o pré-requisito pertence |
| description | TEXT | NOT NULL | Descrição do pré-requisito |

---

## t_scenario_expect
> Resultados esperados de cenários de teste.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| id | SERIAL | PK | Identificador único do resultado esperado |
| scenario_id | INTEGER | FK → t_scenario(id), NOT NULL | Cenário ao qual o resultado pertence |
| description | TEXT | NOT NULL | Descrição do resultado esperado |

---

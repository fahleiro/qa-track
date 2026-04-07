# Tables
> QA Track DB schema – v0.1.0

---

## t_system
> Systems under test.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Auto-incremented identifier |
| title | TEXT | NOT NULL, UNIQUE | System name |

---

## t_feature
> Features linked to a system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Auto-incremented identifier |
| title | TEXT | NOT NULL, UNIQUE | Feature name |
| system_id | INTEGER | FK → t_system(id), NOT NULL | Owning system |

---

## t_scenario_status
> Custom statuses applied to scenarios (e.g. Active, Obsolete, Draft).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Auto-incremented identifier |
| title | TEXT | NOT NULL, UNIQUE | Status label |

---

## t_scenario
> Test scenarios.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Auto-incremented identifier |
| title | TEXT | NOT NULL, UNIQUE | Scenario title |
| status_id | INTEGER | FK → t_scenario_status(id) | Current status |
| feature_id | INTEGER | FK → t_feature(id) | Associated feature |

---

## t_scenario_system
> N:N association between scenarios and systems.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| scenario_id | INTEGER | FK → t_scenario(id), PK | Scenario |
| system_id | INTEGER | FK → t_system(id), PK | System |

---

## t_scenario_pre
> Preconditions for a scenario.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Auto-incremented identifier |
| scenario_id | INTEGER | FK → t_scenario(id), NOT NULL | Owning scenario |
| description | TEXT | NOT NULL | Precondition text |

---

## t_scenario_expect
> Expected results for a scenario.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Auto-incremented identifier |
| scenario_id | INTEGER | FK → t_scenario(id), NOT NULL | Owning scenario |
| description | TEXT | NOT NULL | Expected result text |

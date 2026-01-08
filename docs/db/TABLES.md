# Tables
> QA Track DB tables documentation – v0.1.0

---

## t_system
> Manages the systems to which scenarios and features belong.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Unique system identifier |
| title | TEXT | NOT NULL, UNIQUE | Unique system name |

---

## t_feature
> Manages features linked to a system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Unique feature identifier |
| title | TEXT | NOT NULL, UNIQUE | Unique feature name |
| system_id | INTEGER | FK → t_system(id), NOT NULL | System to which the feature belongs |

---

## t_scenario_status
> Possible statuses for test scenarios.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Unique status identifier |
| title | TEXT | NOT NULL, UNIQUE | Unique status name (e.g., Active, Inactive, Obsolete) |

---

## t_scenario
> Test scenarios registered in the system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Unique scenario identifier |
| title | TEXT | NOT NULL, UNIQUE | Unique scenario title |
| status_id | INTEGER | FK → t_scenario_status(id) | Current scenario status |
| feature_id | INTEGER | FK → t_feature(id) | Feature linked to the scenario |

---

## t_scenario_system
> N:N relationship table between scenarios and systems.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| scenario_id | INTEGER | FK → t_scenario(id), PK | Linked scenario |
| system_id | INTEGER | FK → t_system(id), PK | Linked system |

---

## t_scenario_pre
> Preconditions for test scenarios.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Unique precondition identifier |
| scenario_id | INTEGER | FK → t_scenario(id), NOT NULL | Scenario to which the precondition belongs |
| description | TEXT | NOT NULL | Precondition description |

---

## t_scenario_expect
> Expected results for test scenarios.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Unique expected result identifier |
| scenario_id | INTEGER | FK → t_scenario(id), NOT NULL | Scenario to which the expected result belongs |
| description | TEXT | NOT NULL | Expected result description |

---

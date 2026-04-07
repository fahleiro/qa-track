# Database

QA Track uses PostgreSQL. The schema is designed around test scenarios and their relationships to systems, features, and execution runs.

## Tables

| Table | Description |
|-------|-------------|
| `t_system` | Systems under test |
| `t_feature` | Features linked to a system |
| `t_scenario_status` | Custom statuses for scenarios |
| `t_scenario` | Test scenarios |
| `t_scenario_system` | N:N relationship between scenarios and systems |
| `t_scenario_pre` | Preconditions for a scenario |
| `t_scenario_expect` | Expected results for a scenario |

See [`TABLES.md`](TABLES.md) for full column definitions.

## Relationships

```
t_system (id, title)
    └── t_feature (id, title, system_id)
            └── t_scenario (id, title, status_id, feature_id)
                    ├── t_scenario_system (scenario_id, system_id)  ← N:N with t_system
                    ├── t_scenario_pre (id, scenario_id, description)
                    └── t_scenario_expect (id, scenario_id, description)

t_scenario_status (id, title)  ← referenced by t_scenario.status_id
```

A scenario belongs to a feature, which belongs to a system. A scenario can also be associated with multiple additional systems via `t_scenario_system`.

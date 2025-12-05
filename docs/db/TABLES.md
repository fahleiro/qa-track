### t_system
Gerencia os sistemas aos quais os cenários fazem parte


### 


### **t_scenario_status**
Status possíveis para cenários dentro de execuções.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| id | SERIAL | PK | Identificador do status do cenário |
| title | VARCHAR(50) | NOT NULL, UNIQUE | Nome único do status (ex: Passed, Failed) |
| description | TEXT | Opcional | Detalhes do status |
| is_default | BOOLEAN | DEFAULT FALSE | Status padrão |

---


---

### **t_scenario**
Cenários de teste cadastrados no sistema.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| id | SERIAL | PK | Identificador do cenário |
| title | VARCHAR(255) | NOT NULL, UNIQUE | Título do cenário |
| pre | TEXT | NOT NULL | Pré-condições |
| expec | TEXT | NOT NULL | Resultado esperado |
| suite_id | INTEGER | FK → t_suite(id), ON DELETE SET NULL | Suíte vinculada |

---



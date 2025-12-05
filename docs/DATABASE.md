# Documentação do Modelo de Dados

Gerencia cenários, execuções e resultados de testes automatizados ou manuais.

---

## Tabelas

### **t_scenario_status**
Status possíveis para cenários dentro de execuções.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| id | SERIAL | PK | Identificador do status do cenário |
| title | VARCHAR(50) | NOT NULL, UNIQUE | Nome único do status (ex: Passed, Failed) |
| description | TEXT | Opcional | Detalhes do status |
| is_default | BOOLEAN | DEFAULT FALSE | Status padrão |

---

### **t_run_status**
Status possíveis para execuções (runs).

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| id | SERIAL | PK | Identificador do status de execução |
| title | VARCHAR(50) | NOT NULL, UNIQUE | Nome único do status |
| description | TEXT | Opcional | Detalhes do status |
| is_default | BOOLEAN | DEFAULT FALSE | Status padrão |

---

### **t_suite**
Agrupadores de cenários.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| id | SERIAL | PK | Identificador da suíte |
| title | VARCHAR(255) | NOT NULL, UNIQUE | Nome da suíte |
| description | TEXT | Opcional | Detalhes sobre a suíte |

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

### **t_run**
Execuções de um conjunto de cenários.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| id | SERIAL | PK | Identificador da execução |
| title | VARCHAR(255) | NOT NULL, UNIQUE | Nome da execução |
| description | TEXT | NOT NULL | Descrição da execução |
| status | INTEGER | FK → t_run_status(id), ON DELETE SET NULL | Status atual |

---

### **t_run_detail**
Associação dos cenários incluídos em uma execução.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| run_id | INTEGER | PK, FK → t_run(id), ON DELETE CASCADE | Execução |
| scenario_id | INTEGER | PK, FK → t_scenario(id), ON DELETE CASCADE | Cenário incluído |
> PK composta em **t_run_detail** evita cenários duplicados por execução.
---

### **t_result**
Resultados de execução dos cenários.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| id | SERIAL | PK | Identificador do resultado |
| scenario_id | INTEGER | FK → t_scenario(id), ON DELETE CASCADE | Cenário executado |
| run_id | INTEGER | FK → t_run(id), ON DELETE CASCADE | Execução vinculada |
| status | INTEGER | FK → t_scenario_status(id), ON DELETE SET NULL | Status resultante |

> Permite histórico de reexecuções do mesmo cenário na mesma execução.

> ON DELETE garante que o histórico não seja apagado por remoção de status.

> ON DELETE CASCADE irá remover o resultado.
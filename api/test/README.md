# Testes da API - QA Test Track v0.1.0

## 📋 Visão Geral

Scripts de teste automatizados para validar todas as rotas da API REST.

## 🧪 Scripts de Teste Disponíveis

| Script | Descrição | Rotas Testadas |
|--------|-----------|----------------|
| `01-config-status.test.js` | Testa status de cenários e execuções | `/api/config/status/scenario`<br>`/api/config/status/run` |
| `02-suite.test.js` | Testa gerenciamento de suites | `/api/suite` |
| `03-scenario.test.js` | Testa gerenciamento de cenários | `/api/scenario` |
| `04-run.test.js` | Testa gerenciamento de execuções | `/api/run`<br>`/api/run/:id/scenario` |
| `05-result.test.js` | Testa gerenciamento de resultados | `/api/result` |

## 🚀 Como Executar

### Executar todos os testes:
```bash
cd api
npm test
```

### Executar um teste específico:
```bash
cd api
npm run test:status    # Testa rotas de status
npm run test:suite     # Testa rotas de suite
npm run test:scenario  # Testa rotas de cenário
npm run test:run       # Testa rotas de execução
npm run test:result    # Testa rotas de resultado
```

### Ou executar diretamente:
```bash
cd api
node test/01-config-status.test.js
node test/02-suite.test.js
node test/03-scenario.test.js
node test/04-run.test.js
node test/05-result.test.js
```

## ⚙️ Pré-requisitos

1. **API deve estar rodando**: Certifique-se de que o servidor está em execução na porta 3000
   ```bash
   cd api
   npm start
   ```

2. **Banco de dados**: O PostgreSQL deve estar configurado e as tabelas criadas

3. **Dados iniciais**: Os testes esperam que existam ao menos:
   - 1 status de cenário cadastrado
   - 1 status de execução cadastrado

## 🔍 O Que Cada Teste Valida

### ✅ Funcionalidades Testadas:
- **CRUD completo** para todas as entidades
- **Validações de entrada** (campos obrigatórios)
- **Códigos de status HTTP** corretos (200, 201, 204, 400, 404, 409)
- **Estrutura das respostas** JSON
- **Relacionamentos** entre entidades (FK)
- **Casos de erro** (404, duplicatas, etc)

### 📦 Limpeza Automática:
Todos os testes fazem limpeza automática dos dados criados, exceto:
- Status (esses são mantidos propositalmente)

## 📊 Cobertura de Testes

### Status de Cenário
- ✅ GET - Listar todos
- ✅ POST - Criar novo
- ✅ POST - Validar título vazio
- ✅ PATCH - Atualizar
- ✅ PATCH - Validar 404
- ✅ DELETE - Remover
- ✅ DELETE - Validar remoção duplicada

### Status de Execução
- ✅ GET - Listar todos
- ✅ POST - Criar novo
- ✅ POST - Validar título vazio
- ✅ PATCH - Atualizar
- ✅ DELETE - Remover

### Suite
- ✅ GET - Listar todas
- ✅ GET/:id - Buscar específica
- ✅ GET/:id - Validar 404
- ✅ POST - Criar nova
- ✅ POST - Validar título vazio
- ✅ PATCH - Atualizar
- ✅ PATCH - Validar 404
- ✅ DELETE - Remover
- ✅ DELETE - Validar remoção duplicada

### Cenário
- ✅ GET - Listar todos
- ✅ GET/:id - Buscar específico
- ✅ GET/:id - Validar 404
- ✅ POST - Criar novo
- ✅ POST - Validar título vazio
- ✅ POST - Validar pré-condições vazias
- ✅ POST - Validar resultado esperado vazio
- ✅ PATCH - Atualizar
- ✅ PATCH - Validar 404
- ✅ DELETE - Remover

### Execução (Run)
- ✅ GET - Listar todas
- ✅ GET/:id - Buscar específica
- ✅ GET/:id?expand=details - Buscar com detalhes
- ✅ GET/:id - Validar 404
- ✅ POST - Criar nova
- ✅ POST - Validar título vazio
- ✅ POST - Validar descrição vazia
- ✅ PATCH - Atualizar
- ✅ PATCH - Validar 404
- ✅ POST /run/:id/scenario - Adicionar cenário
- ✅ POST /run/:id/scenario - Validar scenario_id vazio
- ✅ DELETE /run/:runId/scenario/:scenarioId - Remover cenário
- ✅ DELETE /run/:runId/scenario/:scenarioId - Validar remoção duplicada

### Resultado
- ✅ GET - Listar todos
- ✅ GET/:id - Buscar específico
- ✅ GET/:id - Validar 404
- ✅ POST - Criar novo
- ✅ POST - Validar scenario_id vazio
- ✅ POST - Validar run_id vazio
- ✅ POST - Validar status vazio
- ✅ PATCH - Atualizar
- ✅ PATCH - Validar 404
- ✅ DELETE - Remover
- ✅ DELETE - Validar remoção duplicada

## 🎯 Total de Testes

**67 validações** distribuídas em 5 arquivos de teste.

## 💡 Dicas

- Os testes usam `Date.now()` para gerar títulos únicos
- Cada teste é independente e pode ser executado isoladamente
- Os logs coloridos facilitam a identificação de problemas
- Em caso de falha, o código de saída é 1 (útil para CI/CD)

## 🐛 Troubleshooting

### Erro: "fetch is not defined"
**Solução**: Use Node.js 18+ (fetch é nativo a partir dessa versão)

### Erro: "Connection refused"
**Solução**: Certifique-se de que a API está rodando em `http://localhost:3000`

### Erro: "status não encontrado"
**Solução**: Execute os scripts SQL de inicialização do banco para criar os status padrão

---

**Desenvolvido para QA Test Track v0.1.0**


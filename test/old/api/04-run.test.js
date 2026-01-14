/**
 * ====================================
 * TESTES PARA ROTAS DE RUN
 * ====================================
 * Testa: /api/run e /api/run/:id/scenario
 */

const BASE_URL = 'http://localhost:3000';

let createdRunId = null;
let createdScenarioId = null;
let createdSuiteId = null;
let defaultStatusId = null;

// Utilitário para logs coloridos
const log = {
    success: (msg) => console.log('\x1b[32m✓\x1b[0m', msg),
    error: (msg) => console.log('\x1b[31m✗\x1b[0m', msg),
    info: (msg) => console.log('\x1b[36mℹ\x1b[0m', msg),
    section: (msg) => console.log('\n\x1b[33m=====', msg, '=====\x1b[0m')
};

// Função auxiliar para fazer requisições
async function request(method, path, body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${BASE_URL}${path}`, options);
    const data = response.status !== 204 ? await response.json() : null;
    return { status: response.status, data };
}

// ========== PREPARAÇÃO ==========

async function setup() {
    log.section('PREPARAÇÃO: Criar dados para os testes');

    // Buscar status padrão de run
    let res = await request('GET', '/api/config/status/run');
    if (res.data && res.data.length > 0) {
        defaultStatusId = res.data.find(s => s.is_default)?.id || res.data[0].id;
        log.success(`Status padrão encontrado - ID: ${defaultStatusId}`);
    }

    // Criar suite
    res = await request('POST', '/api/suite', {
        title: 'Suite para Teste de Run ' + Date.now(),
        description: 'Suite auxiliar'
    });
    if (res.status === 201) {
        createdSuiteId = res.data.id;
        log.success(`Suite criada - ID: ${createdSuiteId}`);
    }

    // Criar cenário
    res = await request('POST', '/api/scenario', {
        title: 'Cenário para Teste de Run ' + Date.now(),
        prerequisites: ['Pré-condição de teste'],
        expectations: ['Resultado esperado de teste'],
        suite_id: createdSuiteId
    });
    if (res.status === 201) {
        createdScenarioId = res.data.id;
        log.success(`Cenário criado - ID: ${createdScenarioId}`);
    }
}

// ========== TESTES DE RUN ==========

async function testRun() {
    log.section('TESTES: EXECUÇÕES (RUNS)');

    // 1. GET: Listar todas as execuções
    log.info('1. GET /api/run - Listar todas');
    let res = await request('GET', '/api/run');
    if (res.status === 200 && Array.isArray(res.data)) {
        log.success(`Listagem: ${res.data.length} execuções encontradas`);
    } else {
        log.error(`Esperado 200 e array, recebido ${res.status}`);
    }

    // 2. POST: Criar nova execução
    log.info('2. POST /api/run - Criar nova');
    res = await request('POST', '/api/run', {
        title: 'Execução de Teste ' + Date.now(),
        description: 'Execução criada automaticamente por teste',
        status: defaultStatusId
    });
    if (res.status === 201 && res.data.id) {
        createdRunId = res.data.id;
        log.success(`Criada com sucesso - ID: ${createdRunId}`);
    } else {
        log.error(`Esperado 201 com ID, recebido ${res.status}`);
    }

    // 3. POST: Testar erro de título vazio
    log.info('3. POST /api/run - Título vazio (deve falhar)');
    res = await request('POST', '/api/run', { description: 'Teste' });
    if (res.status === 400) {
        log.success('Validação de título vazio funcionou');
    } else {
        log.error(`Esperado 400, recebido ${res.status}`);
    }

    // 4. POST: Testar erro de descrição vazia
    log.info('4. POST /api/run - Descrição vazia (deve falhar)');
    res = await request('POST', '/api/run', { title: 'Teste ' + Date.now() });
    if (res.status === 400) {
        log.success('Validação de descrição vazia funcionou');
    } else {
        log.error(`Esperado 400, recebido ${res.status}`);
    }

    // 5. GET: Buscar execução específica
    if (createdRunId) {
        log.info('5. GET /api/run/:id - Buscar específica');
        res = await request('GET', `/api/run/${createdRunId}`);
        if (res.status === 200 && res.data.id === createdRunId) {
            log.success('Execução encontrada com sucesso');
        } else {
            log.error(`Esperado 200 com ID ${createdRunId}, recebido ${res.status}`);
        }
    }

    // 6. GET: Buscar execução com expand=details
    if (createdRunId) {
        log.info('6. GET /api/run/:id?expand=details - Buscar com detalhes');
        res = await request('GET', `/api/run/${createdRunId}?expand=details`);
        if (res.status === 200 && res.data.details !== undefined) {
            log.success('Execução com detalhes encontrada');
        } else {
            log.error(`Esperado 200 com campo details, recebido ${res.status}`);
        }
    }

    // 7. GET: Testar 404 em execução inexistente
    log.info('7. GET /api/run/99999 - ID inexistente (deve falhar)');
    res = await request('GET', '/api/run/99999');
    if (res.status === 404) {
        log.success('Validação de ID inexistente funcionou');
    } else {
        log.error(`Esperado 404, recebido ${res.status}`);
    }

    // 8. PATCH: Atualizar execução
    if (createdRunId) {
        log.info('8. PATCH /api/run/:id - Atualizar');
        res = await request('PATCH', `/api/run/${createdRunId}`, {
            description: 'Descrição atualizada pelo teste'
        });
        if (res.status === 200 && res.data.id === createdRunId) {
            log.success('Atualização realizada com sucesso');
        } else {
            log.error(`Esperado 200 com mesmo ID, recebido ${res.status}`);
        }
    }

    // 9. PATCH: Testar 404 em execução inexistente
    log.info('9. PATCH /api/run/99999 - ID inexistente (deve falhar)');
    res = await request('PATCH', '/api/run/99999', { description: 'Teste' });
    if (res.status === 404) {
        log.success('Validação de ID inexistente funcionou');
    } else {
        log.error(`Esperado 404, recebido ${res.status}`);
    }
}

// ========== TESTES DE RUN DETAIL (CENÁRIOS NA EXECUÇÃO) ==========

async function testRunDetail() {
    log.section('TESTES: CENÁRIOS NA EXECUÇÃO (RUN_DETAIL)');

    // 1. POST: Adicionar cenário à execução
    if (createdRunId && createdScenarioId) {
        log.info('1. POST /api/run/:id/scenario - Adicionar cenário');
        let res = await request('POST', `/api/run/${createdRunId}/scenario`, {
            scenario_id: createdScenarioId
        });
        if (res.status === 201) {
            log.success('Cenário adicionado à execução');
        } else {
            log.error(`Esperado 201, recebido ${res.status}`);
        }
    }

    // 2. POST: Testar erro de scenario_id vazio
    if (createdRunId) {
        log.info('2. POST /api/run/:id/scenario - scenario_id vazio (deve falhar)');
        let res = await request('POST', `/api/run/${createdRunId}/scenario`, {});
        if (res.status === 400) {
            log.success('Validação de scenario_id vazio funcionou');
        } else {
            log.error(`Esperado 400, recebido ${res.status}`);
        }
    }

    // 3. DELETE: Remover cenário da execução
    if (createdRunId && createdScenarioId) {
        log.info('3. DELETE /api/run/:runId/scenario/:scenarioId - Remover cenário');
        let res = await request('DELETE', `/api/run/${createdRunId}/scenario/${createdScenarioId}`);
        if (res.status === 204) {
            log.success('Cenário removido da execução');
        } else {
            log.error(`Esperado 204, recebido ${res.status}`);
        }
    }

    // 4. DELETE: Testar 404 ao remover novamente
    if (createdRunId && createdScenarioId) {
        log.info('4. DELETE /api/run/:runId/scenario/:scenarioId - Remover novamente (deve falhar)');
        let res = await request('DELETE', `/api/run/${createdRunId}/scenario/${createdScenarioId}`);
        if (res.status === 404) {
            log.success('Validação de remoção duplicada funcionou');
        } else {
            log.error(`Esperado 404, recebido ${res.status}`);
        }
    }
}

// ========== LIMPEZA ==========

async function cleanup() {
    log.section('LIMPEZA: Remover dados de teste');
    if (createdRunId) {
        await request('DELETE', `/api/run/${createdRunId}`);
        log.success('Execução de teste removida');
    }
    if (createdScenarioId) {
        await request('DELETE', `/api/scenario/${createdScenarioId}`);
        log.success('Cenário de teste removido');
    }
    if (createdSuiteId) {
        await request('DELETE', `/api/suite/${createdSuiteId}`);
        log.success('Suite de teste removida');
    }
}

// ========== EXECUÇÃO DOS TESTES ==========

async function runTests() {
    console.log('\n╔═══════════════════════════════════════════════╗');
    console.log('║   TESTES: ROTAS DE RUN                       ║');
    console.log('╚═══════════════════════════════════════════════╝');

    try {
        await setup();
        await testRun();
        await testRunDetail();
        await cleanup();

        console.log('\n\x1b[32m╔═══════════════════════════════════════════════╗\x1b[0m');
        console.log('\x1b[32m║   ✓ TESTES CONCLUÍDOS COM SUCESSO            ║\x1b[0m');
        console.log('\x1b[32m╚═══════════════════════════════════════════════╝\x1b[0m\n');
    } catch (error) {
        console.error('\n\x1b[31m✗ Erro durante os testes:\x1b[0m', error.message);
        await cleanup();
        process.exit(1);
    }
}

// Executar testes
runTests();


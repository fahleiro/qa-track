/**
 * ====================================
 * TESTES PARA ROTAS DE RESULT
 * ====================================
 * Testa: /api/result
 */

const BASE_URL = 'http://localhost:3000';

let createdResultId = null;
let createdRunId = null;
let createdScenarioId = null;
let createdSuiteId = null;
let scenarioStatusId = null;
let runStatusId = null;

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

    // Buscar status de cenário
    let res = await request('GET', '/api/config/status/scenario');
    if (res.data && res.data.length > 0) {
        scenarioStatusId = res.data[0].id;
        log.success(`Status de cenário encontrado - ID: ${scenarioStatusId}`);
    }

    // Buscar status de run
    res = await request('GET', '/api/config/status/run');
    if (res.data && res.data.length > 0) {
        runStatusId = res.data[0].id;
        log.success(`Status de run encontrado - ID: ${runStatusId}`);
    }

    // Criar suite
    res = await request('POST', '/api/suite', {
        title: 'Suite para Teste de Result ' + Date.now(),
        description: 'Suite auxiliar'
    });
    if (res.status === 201) {
        createdSuiteId = res.data.id;
        log.success(`Suite criada - ID: ${createdSuiteId}`);
    }

    // Criar cenário
    res = await request('POST', '/api/scenario', {
        title: 'Cenário para Teste de Result ' + Date.now(),
        prerequisites: ['Pré-condição de teste'],
        expectations: ['Resultado esperado de teste'],
        suite_id: createdSuiteId
    });
    if (res.status === 201) {
        createdScenarioId = res.data.id;
        log.success(`Cenário criado - ID: ${createdScenarioId}`);
    }

    // Criar execução
    res = await request('POST', '/api/run', {
        title: 'Execução para Teste de Result ' + Date.now(),
        description: 'Execução auxiliar',
        status: runStatusId
    });
    if (res.status === 201) {
        createdRunId = res.data.id;
        log.success(`Execução criada - ID: ${createdRunId}`);
    }

    // Adicionar cenário à execução
    if (createdRunId && createdScenarioId) {
        res = await request('POST', `/api/run/${createdRunId}/scenario`, {
            scenario_id: createdScenarioId
        });
        if (res.status === 201) {
            log.success('Cenário vinculado à execução');
        }
    }
}

// ========== TESTES DE RESULTADO ==========

async function testResult() {
    log.section('TESTES: RESULTADOS');

    // 1. GET: Listar todos os resultados
    log.info('1. GET /api/result - Listar todos');
    let res = await request('GET', '/api/result');
    if (res.status === 200 && Array.isArray(res.data)) {
        log.success(`Listagem: ${res.data.length} resultados encontrados`);
    } else {
        log.error(`Esperado 200 e array, recebido ${res.status}`);
    }

    // 2. POST: Criar novo resultado
    if (createdScenarioId && createdRunId && scenarioStatusId) {
        log.info('2. POST /api/result - Criar novo');
        res = await request('POST', '/api/result', {
            scenario_id: createdScenarioId,
            run_id: createdRunId,
            status: scenarioStatusId
        });
        if (res.status === 201 && res.data.id) {
            createdResultId = res.data.id;
            log.success(`Criado com sucesso - ID: ${createdResultId}`);
        } else {
            log.error(`Esperado 201 com ID, recebido ${res.status}`);
        }
    }

    // 3. POST: Testar erro de scenario_id vazio
    log.info('3. POST /api/result - scenario_id vazio (deve falhar)');
    res = await request('POST', '/api/result', {
        run_id: createdRunId,
        status: scenarioStatusId
    });
    if (res.status === 400) {
        log.success('Validação de scenario_id vazio funcionou');
    } else {
        log.error(`Esperado 400, recebido ${res.status}`);
    }

    // 4. POST: Testar erro de run_id vazio
    log.info('4. POST /api/result - run_id vazio (deve falhar)');
    res = await request('POST', '/api/result', {
        scenario_id: createdScenarioId,
        status: scenarioStatusId
    });
    if (res.status === 400) {
        log.success('Validação de run_id vazio funcionou');
    } else {
        log.error(`Esperado 400, recebido ${res.status}`);
    }

    // 5. POST: Testar erro de status vazio
    log.info('5. POST /api/result - status vazio (deve falhar)');
    res = await request('POST', '/api/result', {
        scenario_id: createdScenarioId,
        run_id: createdRunId
    });
    if (res.status === 400) {
        log.success('Validação de status vazio funcionou');
    } else {
        log.error(`Esperado 400, recebido ${res.status}`);
    }

    // 6. GET: Buscar resultado específico
    if (createdResultId) {
        log.info('6. GET /api/result/:id - Buscar específico');
        res = await request('GET', `/api/result/${createdResultId}`);
        if (res.status === 200 && res.data.id === createdResultId) {
            log.success('Resultado encontrado com sucesso');
        } else {
            log.error(`Esperado 200 com ID ${createdResultId}, recebido ${res.status}`);
        }
    }

    // 7. GET: Testar 404 em resultado inexistente
    log.info('7. GET /api/result/99999 - ID inexistente (deve falhar)');
    res = await request('GET', '/api/result/99999');
    if (res.status === 404) {
        log.success('Validação de ID inexistente funcionou');
    } else {
        log.error(`Esperado 404, recebido ${res.status}`);
    }

    // 8. PATCH: Atualizar resultado
    if (createdResultId) {
        log.info('8. PATCH /api/result/:id - Atualizar status');
        res = await request('PATCH', `/api/result/${createdResultId}`, {
            status: scenarioStatusId
        });
        if (res.status === 200 && res.data.id === createdResultId) {
            log.success('Atualização realizada com sucesso');
        } else {
            log.error(`Esperado 200 com mesmo ID, recebido ${res.status}`);
        }
    }

    // 9. PATCH: Testar 404 em resultado inexistente
    log.info('9. PATCH /api/result/99999 - ID inexistente (deve falhar)');
    res = await request('PATCH', '/api/result/99999', { status: scenarioStatusId });
    if (res.status === 404) {
        log.success('Validação de ID inexistente funcionou');
    } else {
        log.error(`Esperado 404, recebido ${res.status}`);
    }

    // 10. DELETE: Remover resultado criado
    if (createdResultId) {
        log.info('10. DELETE /api/result/:id - Remover');
        res = await request('DELETE', `/api/result/${createdResultId}`);
        if (res.status === 204) {
            log.success('Remoção realizada com sucesso');
        } else {
            log.error(`Esperado 204, recebido ${res.status}`);
        }
    }

    // 11. DELETE: Testar 404 ao remover novamente
    if (createdResultId) {
        log.info('11. DELETE /api/result/:id - Remover novamente (deve falhar)');
        res = await request('DELETE', `/api/result/${createdResultId}`);
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
    console.log('║   TESTES: ROTAS DE RESULT                    ║');
    console.log('╚═══════════════════════════════════════════════╝');

    try {
        await setup();
        await testResult();
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


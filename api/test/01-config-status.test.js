/**
 * ====================================
 * TESTES PARA ROTAS DE CONFIG/STATUS
 * ====================================
 * Testa: /api/config/status/scenario e /api/config/status/run
 */

const BASE_URL = 'http://localhost:3000';

let createdScenarioStatusId = null;
let createdRunStatusId = null;

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

// ========== TESTES DE STATUS DE CENÁRIO ==========

async function testScenarioStatus() {
    log.section('TESTES: STATUS DE CENÁRIO');

    // 1. GET: Listar todos os status de cenário
    log.info('1. GET /api/config/status/scenario - Listar todos');
    let res = await request('GET', '/api/config/status/scenario');
    if (res.status === 200 && Array.isArray(res.data)) {
        log.success(`Listagem: ${res.data.length} status encontrados`);
    } else {
        log.error(`Esperado 200 e array, recebido ${res.status}`);
    }

    // 2. POST: Criar novo status de cenário
    log.info('2. POST /api/config/status/scenario - Criar novo');
    res = await request('POST', '/api/config/status/scenario', {
        title: 'TEST_STATUS_' + Date.now(),
        description: 'Status criado por teste automatizado',
        is_default: false
    });
    if (res.status === 201 && res.data.id) {
        createdScenarioStatusId = res.data.id;
        log.success(`Criado com sucesso - ID: ${createdScenarioStatusId}`);
    } else {
        log.error(`Esperado 201 com ID, recebido ${res.status}`);
    }

    // 3. POST: Testar erro de título vazio
    log.info('3. POST /api/config/status/scenario - Título vazio (deve falhar)');
    res = await request('POST', '/api/config/status/scenario', { description: 'Sem título' });
    if (res.status === 400) {
        log.success('Validação de título vazio funcionou');
    } else {
        log.error(`Esperado 400, recebido ${res.status}`);
    }

    // 4. PATCH: Atualizar status
    if (createdScenarioStatusId) {
        log.info('4. PATCH /api/config/status/scenario/:id - Atualizar');
        res = await request('PATCH', `/api/config/status/scenario/${createdScenarioStatusId}`, {
            description: 'Descrição atualizada pelo teste'
        });
        if (res.status === 200 && res.data.id === createdScenarioStatusId) {
            log.success('Atualização realizada com sucesso');
        } else {
            log.error(`Esperado 200 com mesmo ID, recebido ${res.status}`);
        }
    }

    // 5. PATCH: Testar 404 em status inexistente
    log.info('5. PATCH /api/config/status/scenario/99999 - ID inexistente (deve falhar)');
    res = await request('PATCH', '/api/config/status/scenario/99999', { description: 'Teste' });
    if (res.status === 404) {
        log.success('Validação de ID inexistente funcionou');
    } else {
        log.error(`Esperado 404, recebido ${res.status}`);
    }

    // 6. DELETE: Remover status criado
    if (createdScenarioStatusId) {
        log.info('6. DELETE /api/config/status/scenario/:id - Remover');
        res = await request('DELETE', `/api/config/status/scenario/${createdScenarioStatusId}`);
        if (res.status === 204) {
            log.success('Remoção realizada com sucesso');
        } else {
            log.error(`Esperado 204, recebido ${res.status}`);
        }
    }

    // 7. DELETE: Testar 404 ao remover novamente
    if (createdScenarioStatusId) {
        log.info('7. DELETE /api/config/status/scenario/:id - Remover novamente (deve falhar)');
        res = await request('DELETE', `/api/config/status/scenario/${createdScenarioStatusId}`);
        if (res.status === 404) {
            log.success('Validação de remoção duplicada funcionou');
        } else {
            log.error(`Esperado 404, recebido ${res.status}`);
        }
    }
}

// ========== TESTES DE STATUS DE EXECUÇÃO ==========

async function testRunStatus() {
    log.section('TESTES: STATUS DE EXECUÇÃO');

    // 1. GET: Listar todos os status de execução
    log.info('1. GET /api/config/status/run - Listar todos');
    let res = await request('GET', '/api/config/status/run');
    if (res.status === 200 && Array.isArray(res.data)) {
        log.success(`Listagem: ${res.data.length} status encontrados`);
    } else {
        log.error(`Esperado 200 e array, recebido ${res.status}`);
    }

    // 2. POST: Criar novo status de execução
    log.info('2. POST /api/config/status/run - Criar novo');
    res = await request('POST', '/api/config/status/run', {
        title: 'TEST_RUN_STATUS_' + Date.now(),
        description: 'Status de run criado por teste',
        is_default: false
    });
    if (res.status === 201 && res.data.id) {
        createdRunStatusId = res.data.id;
        log.success(`Criado com sucesso - ID: ${createdRunStatusId}`);
    } else {
        log.error(`Esperado 201 com ID, recebido ${res.status}`);
    }

    // 3. POST: Testar erro de título vazio
    log.info('3. POST /api/config/status/run - Título vazio (deve falhar)');
    res = await request('POST', '/api/config/status/run', { description: 'Sem título' });
    if (res.status === 400) {
        log.success('Validação de título vazio funcionou');
    } else {
        log.error(`Esperado 400, recebido ${res.status}`);
    }

    // 4. PATCH: Atualizar status
    if (createdRunStatusId) {
        log.info('4. PATCH /api/config/status/run/:id - Atualizar');
        res = await request('PATCH', `/api/config/status/run/${createdRunStatusId}`, {
            description: 'Descrição atualizada pelo teste'
        });
        if (res.status === 200 && res.data.id === createdRunStatusId) {
            log.success('Atualização realizada com sucesso');
        } else {
            log.error(`Esperado 200 com mesmo ID, recebido ${res.status}`);
        }
    }

    // 5. DELETE: Remover status criado
    if (createdRunStatusId) {
        log.info('5. DELETE /api/config/status/run/:id - Remover');
        res = await request('DELETE', `/api/config/status/run/${createdRunStatusId}`);
        if (res.status === 204) {
            log.success('Remoção realizada com sucesso');
        } else {
            log.error(`Esperado 204, recebido ${res.status}`);
        }
    }
}

// ========== EXECUÇÃO DOS TESTES ==========

async function runTests() {
    console.log('\n╔═══════════════════════════════════════════════╗');
    console.log('║   TESTES: ROTAS DE CONFIG/STATUS            ║');
    console.log('╚═══════════════════════════════════════════════╝');

    try {
        await testScenarioStatus();
        await testRunStatus();

        console.log('\n\x1b[32m╔═══════════════════════════════════════════════╗\x1b[0m');
        console.log('\x1b[32m║   ✓ TESTES CONCLUÍDOS COM SUCESSO            ║\x1b[0m');
        console.log('\x1b[32m╚═══════════════════════════════════════════════╝\x1b[0m\n');
    } catch (error) {
        console.error('\n\x1b[31m✗ Erro durante os testes:\x1b[0m', error.message);
        process.exit(1);
    }
}

// Executar testes
runTests();


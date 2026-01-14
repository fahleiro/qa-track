/**
 * ====================================
 * TESTES PARA ROTAS DE SCENARIO
 * ====================================
 * Testa: /api/scenario
 */

const BASE_URL = 'http://localhost:3000';

let createdScenarioId = null;
let createdSuiteId = null;

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
    log.section('PREPARAÇÃO: Criar Suite para os testes');
    const res = await request('POST', '/api/suite', {
        title: 'Suite para Teste de Cenário ' + Date.now(),
        description: 'Suite auxiliar para teste de cenários'
    });
    if (res.status === 201 && res.data.id) {
        createdSuiteId = res.data.id;
        log.success(`Suite criada - ID: ${createdSuiteId}`);
    }
}

// ========== TESTES DE CENÁRIO ==========

async function testScenario() {
    log.section('TESTES: CENÁRIOS');

    // 1. GET: Listar todos os cenários
    log.info('1. GET /api/scenario - Listar todos');
    let res = await request('GET', '/api/scenario');
    if (res.status === 200 && Array.isArray(res.data)) {
        log.success(`Listagem: ${res.data.length} cenários encontrados`);
    } else {
        log.error(`Esperado 200 e array, recebido ${res.status}`);
    }

    // 2. POST: Criar novo cenário
    log.info('2. POST /api/scenario - Criar novo');
    res = await request('POST', '/api/scenario', {
        title: 'Cenário de Teste ' + Date.now(),
        prerequisites: ['Usuário deve estar logado no sistema'],
        expectations: ['Sistema deve exibir a tela principal'],
        suite_id: createdSuiteId
    });
    if (res.status === 201 && res.data.id) {
        createdScenarioId = res.data.id;
        log.success(`Criado com sucesso - ID: ${createdScenarioId}`);
    } else {
        log.error(`Esperado 201 com ID, recebido ${res.status}`);
    }

    // 3. POST: Testar erro de título vazio
    log.info('3. POST /api/scenario - Título vazio (deve falhar)');
    res = await request('POST', '/api/scenario', {
        prerequisites: ['Teste'],
        expectations: ['Teste']
    });
    if (res.status === 400) {
        log.success('Validação de título vazio funcionou');
    } else {
        log.error(`Esperado 400, recebido ${res.status}`);
    }

    // 4. POST: Testar erro de pré-requisitos vazios
    log.info('4. POST /api/scenario - Pré-requisitos vazios (deve falhar)');
    res = await request('POST', '/api/scenario', {
        title: 'Teste ' + Date.now(),
        expectations: ['Teste']
    });
    if (res.status === 400) {
        log.success('Validação de pré-requisitos vazios funcionou');
    } else {
        log.error(`Esperado 400, recebido ${res.status}`);
    }

    // 5. POST: Testar erro de resultados esperados vazios
    log.info('5. POST /api/scenario - Resultados esperados vazios (deve falhar)');
    res = await request('POST', '/api/scenario', {
        title: 'Teste ' + Date.now(),
        prerequisites: ['Teste']
    });
    if (res.status === 400) {
        log.success('Validação de resultados esperados vazios funcionou');
    } else {
        log.error(`Esperado 400, recebido ${res.status}`);
    }

    // 6. GET: Buscar cenário específico
    if (createdScenarioId) {
        log.info('6. GET /api/scenario/:id - Buscar específico');
        res = await request('GET', `/api/scenario/${createdScenarioId}`);
        if (res.status === 200 && res.data.id === createdScenarioId) {
            log.success('Cenário encontrado com sucesso');
        } else {
            log.error(`Esperado 200 com ID ${createdScenarioId}, recebido ${res.status}`);
        }
    }

    // 7. GET: Testar 404 em cenário inexistente
    log.info('7. GET /api/scenario/99999 - ID inexistente (deve falhar)');
    res = await request('GET', '/api/scenario/99999');
    if (res.status === 404) {
        log.success('Validação de ID inexistente funcionou');
    } else {
        log.error(`Esperado 404, recebido ${res.status}`);
    }

    // 8. PATCH: Atualizar cenário (título)
    if (createdScenarioId) {
        log.info('8. PATCH /api/scenario/:id - Atualizar título');
        res = await request('PATCH', `/api/scenario/${createdScenarioId}`, {
            title: 'Título atualizado pelo teste ' + Date.now()
        });
        if (res.status === 200 && res.data.id === createdScenarioId) {
            log.success('Atualização realizada com sucesso');
        } else {
            log.error(`Esperado 200 com mesmo ID, recebido ${res.status}`);
        }
    }

    // 9. PATCH: Testar 404 em cenário inexistente
    log.info('9. PATCH /api/scenario/99999 - ID inexistente (deve falhar)');
    res = await request('PATCH', '/api/scenario/99999', { title: 'Teste' });
    if (res.status === 404) {
        log.success('Validação de ID inexistente funcionou');
    } else {
        log.error(`Esperado 404, recebido ${res.status}`);
    }

    // 10. DELETE: Remover cenário criado
    if (createdScenarioId) {
        log.info('10. DELETE /api/scenario/:id - Remover');
        res = await request('DELETE', `/api/scenario/${createdScenarioId}`);
        if (res.status === 204) {
            log.success('Remoção realizada com sucesso');
        } else {
            log.error(`Esperado 204, recebido ${res.status}`);
        }
    }
}

// ========== LIMPEZA ==========

async function cleanup() {
    log.section('LIMPEZA: Remover dados de teste');
    if (createdSuiteId) {
        await request('DELETE', `/api/suite/${createdSuiteId}`);
        log.success('Suite de teste removida');
    }
}

// ========== EXECUÇÃO DOS TESTES ==========

async function runTests() {
    console.log('\n╔═══════════════════════════════════════════════╗');
    console.log('║   TESTES: ROTAS DE SCENARIO                  ║');
    console.log('╚═══════════════════════════════════════════════╝');

    try {
        await setup();
        await testScenario();
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


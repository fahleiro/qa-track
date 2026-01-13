/**
 * ====================================
 * TESTES PARA ROTAS DE SUITE
 * ====================================
 * Testa: /api/suite
 */

const BASE_URL = 'http://localhost:3000';

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

// ========== TESTES DE SUITE ==========

async function testSuite() {
    log.section('TESTES: SUITES');

    // 1. GET: Listar todas as suites
    log.info('1. GET /api/suite - Listar todas');
    let res = await request('GET', '/api/suite');
    if (res.status === 200 && Array.isArray(res.data)) {
        log.success(`Listagem: ${res.data.length} suites encontradas`);
    } else {
        log.error(`Esperado 200 e array, recebido ${res.status}`);
    }

    // 2. POST: Criar nova suite
    log.info('2. POST /api/suite - Criar nova');
    res = await request('POST', '/api/suite', {
        title: 'Suite de Teste ' + Date.now(),
        description: 'Suite criada automaticamente por teste'
    });
    if (res.status === 201 && res.data.id) {
        createdSuiteId = res.data.id;
        log.success(`Criada com sucesso - ID: ${createdSuiteId}`);
    } else {
        log.error(`Esperado 201 com ID, recebido ${res.status}`);
    }

    // 3. POST: Testar erro de título vazio
    log.info('3. POST /api/suite - Título vazio (deve falhar)');
    res = await request('POST', '/api/suite', { description: 'Sem título' });
    if (res.status === 400) {
        log.success('Validação de título vazio funcionou');
    } else {
        log.error(`Esperado 400, recebido ${res.status}`);
    }

    // 4. GET: Buscar suite específica
    if (createdSuiteId) {
        log.info('4. GET /api/suite/:id - Buscar específica');
        res = await request('GET', `/api/suite/${createdSuiteId}`);
        if (res.status === 200 && res.data.id === createdSuiteId) {
            log.success('Suite encontrada com sucesso');
        } else {
            log.error(`Esperado 200 com ID ${createdSuiteId}, recebido ${res.status}`);
        }
    }

    // 5. GET: Testar 404 em suite inexistente
    log.info('5. GET /api/suite/99999 - ID inexistente (deve falhar)');
    res = await request('GET', '/api/suite/99999');
    if (res.status === 404) {
        log.success('Validação de ID inexistente funcionou');
    } else {
        log.error(`Esperado 404, recebido ${res.status}`);
    }

    // 6. PATCH: Atualizar suite
    if (createdSuiteId) {
        log.info('6. PATCH /api/suite/:id - Atualizar');
        res = await request('PATCH', `/api/suite/${createdSuiteId}`, {
            description: 'Descrição atualizada pelo teste'
        });
        if (res.status === 200 && res.data.id === createdSuiteId) {
            log.success('Atualização realizada com sucesso');
        } else {
            log.error(`Esperado 200 com mesmo ID, recebido ${res.status}`);
        }
    }

    // 7. PATCH: Testar 404 em suite inexistente
    log.info('7. PATCH /api/suite/99999 - ID inexistente (deve falhar)');
    res = await request('PATCH', '/api/suite/99999', { description: 'Teste' });
    if (res.status === 404) {
        log.success('Validação de ID inexistente funcionou');
    } else {
        log.error(`Esperado 404, recebido ${res.status}`);
    }

    // 8. DELETE: Remover suite criada
    if (createdSuiteId) {
        log.info('8. DELETE /api/suite/:id - Remover');
        res = await request('DELETE', `/api/suite/${createdSuiteId}`);
        if (res.status === 204) {
            log.success('Remoção realizada com sucesso');
        } else {
            log.error(`Esperado 204, recebido ${res.status}`);
        }
    }

    // 9. DELETE: Testar 404 ao remover novamente
    if (createdSuiteId) {
        log.info('9. DELETE /api/suite/:id - Remover novamente (deve falhar)');
        res = await request('DELETE', `/api/suite/${createdSuiteId}`);
        if (res.status === 404) {
            log.success('Validação de remoção duplicada funcionou');
        } else {
            log.error(`Esperado 404, recebido ${res.status}`);
        }
    }
}

// ========== EXECUÇÃO DOS TESTES ==========

async function runTests() {
    console.log('\n╔═══════════════════════════════════════════════╗');
    console.log('║   TESTES: ROTAS DE SUITE                     ║');
    console.log('╚═══════════════════════════════════════════════╝');

    try {
        await testSuite();

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


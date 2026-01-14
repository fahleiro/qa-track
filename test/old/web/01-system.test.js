/**
 * ====================================
 * TESTES WEB: SISTEMA
 * ====================================
 * Testa: Criar sistema + Pesquisar sistema
 * Validação dupla: Interface Web + Banco de Dados
 */

const {
    By,
    createDriver,
    navigateTo,
    fillInput,
    clickElement,
    waitForElement,
    waitForText,
    getText,
    findElements,
    closeDriver,
    log
} = require('./config/web-driver');

const {
    findSystemByTitle,
    deleteSystemByTitle
} = require('./config/db-helper');

// Dados de teste
const TEST_SYSTEM_NAME = `TEST_SYSTEM_WEB_${Date.now()}`;

let driver = null;
let testsPassed = 0;
let testsFailed = 0;

// ========== TESTES DE SISTEMA ==========

async function testCreateSystem() {
    log.info('Teste: Criar Sistema via Interface Web');

    try {
        // 1. Navegar para página de configuração
        await navigateTo(driver, '/config');
        await driver.sleep(1000);

        // 2. Garantir que está na aba Sistemas
        const systemsTab = await waitForElement(driver, By.xpath("//button[contains(@class, 'tab') and contains(text(), 'Sistemas')]"));
        await systemsTab.click();
        await driver.sleep(500);

        // 3. Preencher o campo de input com nome do sistema
        await fillInput(driver, By.css('.inline-add input.form-input'), TEST_SYSTEM_NAME);

        // 4. Clicar no botão Adicionar
        await clickElement(driver, By.xpath("//button[contains(@class, 'btn-primary') and contains(text(), 'Adicionar')]"));
        await driver.sleep(1000);

        // 5. Validação na Interface - Verificar se o sistema aparece na lista
        await waitForText(driver, TEST_SYSTEM_NAME);
        log.success('Interface: Sistema criado e visível na lista');

        // 6. Validação no Banco de Dados
        const dbResult = await findSystemByTitle(TEST_SYSTEM_NAME);
        if (dbResult.exists) {
            log.success(`Banco de Dados: Sistema encontrado (ID: ${dbResult.data.id})`);
            testsPassed++;
        } else {
            log.error('Banco de Dados: Sistema NÃO encontrado');
            testsFailed++;
        }

    } catch (error) {
        log.error(`Erro ao criar sistema: ${error.message}`);
        testsFailed++;
    }
}

async function testSearchSystem() {
    log.info('Teste: Pesquisar Sistema na página de Cenários');

    try {
        // 1. Navegar para página de cenários
        await navigateTo(driver, '/');
        await driver.sleep(1000);

        // 2. Localizar o dropdown de filtro por sistema
        const systemFilter = await waitForElement(driver, By.css('.filter-select'));
        await systemFilter.click();
        await driver.sleep(300);

        // 3. Verificar se o sistema criado aparece no dropdown
        const options = await systemFilter.findElements(By.tagName('option'));
        let systemFound = false;
        
        for (const option of options) {
            const text = await option.getText();
            if (text.includes(TEST_SYSTEM_NAME)) {
                systemFound = true;
                break;
            }
        }

        if (systemFound) {
            log.success('Interface: Sistema encontrado no dropdown de filtro');
            testsPassed++;
        } else {
            log.error('Interface: Sistema NÃO encontrado no dropdown de filtro');
            testsFailed++;
        }

    } catch (error) {
        log.error(`Erro ao pesquisar sistema: ${error.message}`);
        testsFailed++;
    }
}

async function testValidateSystemInListbox() {
    log.info('Teste: Validar Sistema no Listbox de Sistemas');

    try {
        // 1. Navegar para página de configuração
        await navigateTo(driver, '/config');
        await driver.sleep(1000);

        // 2. Garantir que está na aba Sistemas
        const systemsTab = await waitForElement(driver, By.xpath("//button[contains(@class, 'tab') and contains(text(), 'Sistemas')]"));
        await systemsTab.click();
        await driver.sleep(500);

        // 3. Buscar todos os itens da lista
        const listItems = await findElements(driver, By.css('.list-item'));
        let systemFoundInList = false;
        let systemId = null;

        for (const item of listItems) {
            const itemText = await item.getText();
            if (itemText.includes(TEST_SYSTEM_NAME)) {
                systemFoundInList = true;
                // Extrair o ID do sistema do texto (formato: #ID NomeSistema)
                const idMatch = itemText.match(/#(\d+)/);
                if (idMatch) {
                    systemId = idMatch[1];
                }
                break;
            }
        }

        if (systemFoundInList) {
            log.success(`Interface: Sistema "${TEST_SYSTEM_NAME}" encontrado na lista (ID: ${systemId})`);
            testsPassed++;
        } else {
            log.error(`Interface: Sistema "${TEST_SYSTEM_NAME}" NÃO encontrado na lista`);
            testsFailed++;
        }

    } catch (error) {
        log.error(`Erro ao validar sistema no listbox: ${error.message}`);
        testsFailed++;
    }
}

// ========== CLEANUP ==========

async function cleanup() {
    log.info('Executando cleanup dos dados de teste...');
    try {
        const deleted = await deleteSystemByTitle(TEST_SYSTEM_NAME);
        if (deleted) {
            log.success('Cleanup: Sistema de teste removido do banco');
        } else {
            log.warn('Cleanup: Sistema de teste não encontrado para remoção');
        }
    } catch (error) {
        log.error(`Erro no cleanup: ${error.message}`);
    }
}

// ========== EXECUÇÃO DOS TESTES ==========

async function runTests() {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║   TESTES WEB: SISTEMA                                 ║');
    console.log('╚═══════════════════════════════════════════════════════╝');

    try {
        // Inicializar driver
        log.info('Inicializando WebDriver...');
        driver = await createDriver();
        log.success('WebDriver inicializado');

        // Executar testes
        log.section('CRIAR SISTEMA');
        await testCreateSystem();

        log.section('PESQUISAR SISTEMA');
        await testSearchSystem();

        log.section('VALIDAR SISTEMA NO LISTBOX');
        await testValidateSystemInListbox();

        // Cleanup
        log.section('CLEANUP');
        await cleanup();

    } catch (error) {
        log.error(`Erro fatal: ${error.message}`);
        testsFailed++;
    } finally {
        // Fechar driver
        if (driver) {
            await closeDriver(driver);
            log.info('WebDriver encerrado');
        }
    }

    // Resumo
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║   RESUMO: TESTES DE SISTEMA                           ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log(`\x1b[32m✓ Testes aprovados: ${testsPassed}\x1b[0m`);
    console.log(`\x1b[31m✗ Testes falhados: ${testsFailed}\x1b[0m`);

    if (testsFailed > 0) {
        process.exit(1);
    }
}

// Executar
runTests();

/**
 * ====================================
 * TESTES WEB: STATUS
 * ====================================
 * Testa: Criar status com validação no banco de dados
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
    findElements,
    closeDriver,
    log
} = require('./config/web-driver');

const {
    findStatusByTitle,
    deleteStatusByTitle
} = require('./config/db-helper');

// Dados de teste
const TEST_STATUS_NAME = `TEST_STATUS_WEB_${Date.now()}`;

let driver = null;
let testsPassed = 0;
let testsFailed = 0;

// ========== TESTES DE STATUS ==========

async function testCreateStatus() {
    log.info('Teste: Criar Status via Interface Web');

    try {
        // 1. Navegar para página de configuração
        await navigateTo(driver, '/config');
        await driver.sleep(1000);

        // 2. Clicar na aba Status
        const statusTab = await waitForElement(driver, By.xpath("//button[contains(@class, 'tab') and contains(text(), 'Status')]"));
        await statusTab.click();
        await driver.sleep(500);

        // 3. Preencher o campo de input com nome do status
        await fillInput(driver, By.css('.inline-add input.form-input'), TEST_STATUS_NAME);

        // 4. Clicar no botão Adicionar
        await clickElement(driver, By.xpath("//button[contains(@class, 'btn-primary') and contains(text(), 'Adicionar')]"));
        await driver.sleep(1000);

        // 5. Validação na Interface - Verificar se o status aparece na lista
        await waitForText(driver, TEST_STATUS_NAME);
        log.success('Interface: Status criado e visível na lista');

        // 6. Validação no Banco de Dados
        const dbResult = await findStatusByTitle(TEST_STATUS_NAME);
        if (dbResult.exists) {
            log.success(`Banco de Dados: Status encontrado (ID: ${dbResult.data.id})`);
            testsPassed++;
        } else {
            log.error('Banco de Dados: Status NÃO encontrado');
            testsFailed++;
        }

    } catch (error) {
        log.error(`Erro ao criar status: ${error.message}`);
        testsFailed++;
    }
}

async function testValidateStatusInList() {
    log.info('Teste: Validar Status na Lista de Status');

    try {
        // 1. Garantir que está na aba Status
        await navigateTo(driver, '/config');
        await driver.sleep(1000);

        const statusTab = await waitForElement(driver, By.xpath("//button[contains(@class, 'tab') and contains(text(), 'Status')]"));
        await statusTab.click();
        await driver.sleep(500);

        // 2. Buscar o status na lista
        const listItems = await findElements(driver, By.css('.list-item'));
        let statusFoundInList = false;
        let statusId = null;

        for (const item of listItems) {
            const itemText = await item.getText();
            if (itemText.includes(TEST_STATUS_NAME)) {
                statusFoundInList = true;
                
                // Extrair ID
                const idMatch = itemText.match(/#(\d+)/);
                if (idMatch) {
                    statusId = idMatch[1];
                }
                break;
            }
        }

        if (statusFoundInList) {
            log.success(`Interface: Status "${TEST_STATUS_NAME}" encontrado na lista (ID: ${statusId})`);
            testsPassed++;
        } else {
            log.error(`Interface: Status "${TEST_STATUS_NAME}" NÃO encontrado na lista`);
            testsFailed++;
        }

    } catch (error) {
        log.error(`Erro ao validar status na lista: ${error.message}`);
        testsFailed++;
    }
}

async function testStatusAppearsInScenarioFilter() {
    log.info('Teste: Validar Status no Dropdown de Filtro de Cenários');

    try {
        // 1. Navegar para página de cenários
        await navigateTo(driver, '/');
        await driver.sleep(1000);

        // 2. Localizar o dropdown de filtro por status (terceiro select)
        const filterSelects = await findElements(driver, By.css('.filter-select'));
        
        if (filterSelects.length >= 3) {
            const statusFilter = filterSelects[2]; // Terceiro dropdown é o de status
            await statusFilter.click();
            await driver.sleep(300);

            // 3. Verificar se o status criado aparece no dropdown
            const options = await statusFilter.findElements(By.tagName('option'));
            let statusFound = false;

            for (const option of options) {
                const text = await option.getText();
                if (text.includes(TEST_STATUS_NAME)) {
                    statusFound = true;
                    break;
                }
            }

            if (statusFound) {
                log.success('Interface: Status encontrado no dropdown de filtro de cenários');
                testsPassed++;
            } else {
                log.error('Interface: Status NÃO encontrado no dropdown de filtro de cenários');
                testsFailed++;
            }
        } else {
            log.error('Interface: Dropdown de filtro de status não encontrado');
            testsFailed++;
        }

    } catch (error) {
        log.error(`Erro ao validar status no filtro: ${error.message}`);
        testsFailed++;
    }
}

// ========== CLEANUP ==========

async function cleanup() {
    log.info('Executando cleanup dos dados de teste...');
    
    try {
        const deleted = await deleteStatusByTitle(TEST_STATUS_NAME);
        if (deleted) {
            log.success('Cleanup: Status de teste removido do banco');
        } else {
            log.warn('Cleanup: Status de teste não encontrado para remoção');
        }
    } catch (error) {
        log.error(`Erro no cleanup: ${error.message}`);
    }
}

// ========== EXECUÇÃO DOS TESTES ==========

async function runTests() {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║   TESTES WEB: STATUS                                  ║');
    console.log('╚═══════════════════════════════════════════════════════╝');

    try {
        // Inicializar driver
        log.info('Inicializando WebDriver...');
        driver = await createDriver();
        log.success('WebDriver inicializado');

        // Executar testes
        log.section('CRIAR STATUS');
        await testCreateStatus();

        log.section('VALIDAR STATUS NA LISTA');
        await testValidateStatusInList();

        log.section('VALIDAR STATUS NO FILTRO DE CENÁRIOS');
        await testStatusAppearsInScenarioFilter();

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
    console.log('║   RESUMO: TESTES DE STATUS                            ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log(`\x1b[32m✓ Testes aprovados: ${testsPassed}\x1b[0m`);
    console.log(`\x1b[31m✗ Testes falhados: ${testsFailed}\x1b[0m`);

    if (testsFailed > 0) {
        process.exit(1);
    }
}

// Executar
runTests();

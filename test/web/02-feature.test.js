/**
 * ====================================
 * TESTES WEB: FEATURE
 * ====================================
 * Testa: Criar feature com validação no banco de dados
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
    selectOptionByText,
    findElements,
    closeDriver,
    log
} = require('./config/web-driver');

const {
    findFeatureByTitle,
    findSystemByTitle,
    deleteFeatureByTitle,
    deleteSystemByTitle,
    getAllSystems
} = require('./config/db-helper');

// Dados de teste
const timestamp = Date.now();
const TEST_SYSTEM_NAME = `TEST_SYS_FOR_FEAT_${timestamp}`;
const TEST_FEATURE_NAME = `TEST_FEATURE_WEB_${timestamp}`;

let driver = null;
let testsPassed = 0;
let testsFailed = 0;

// ========== SETUP ==========

async function setup() {
    log.info('Setup: Criando sistema para associar à feature...');

    try {
        // 1. Navegar para página de configuração
        await navigateTo(driver, '/config');
        await driver.sleep(1000);

        // 2. Criar sistema necessário para a feature
        const systemsTab = await waitForElement(driver, By.xpath("//button[contains(@class, 'tab') and contains(text(), 'Sistemas')]"));
        await systemsTab.click();
        await driver.sleep(500);

        await fillInput(driver, By.css('.inline-add input.form-input'), TEST_SYSTEM_NAME);
        await clickElement(driver, By.xpath("//button[contains(@class, 'btn-primary') and contains(text(), 'Adicionar')]"));
        await driver.sleep(1000);

        // Verificar se foi criado
        const systemCreated = await findSystemByTitle(TEST_SYSTEM_NAME);
        if (systemCreated.exists) {
            log.success(`Setup: Sistema "${TEST_SYSTEM_NAME}" criado com sucesso`);
        } else {
            log.error('Setup: Falha ao criar sistema de pré-requisito');
        }

    } catch (error) {
        log.error(`Erro no setup: ${error.message}`);
    }
}

// ========== TESTES DE FEATURE ==========

async function testCreateFeature() {
    log.info('Teste: Criar Feature via Interface Web');

    try {
        // 1. Navegar para página de configuração
        await navigateTo(driver, '/config');
        await driver.sleep(1000);

        // 2. Clicar na aba Features
        const featuresTab = await waitForElement(driver, By.xpath("//button[contains(@class, 'tab') and contains(text(), 'Features')]"));
        await featuresTab.click();
        await driver.sleep(500);

        // 3. Preencher o nome da feature
        const featureInputs = await findElements(driver, By.css('.inline-add input.form-input'));
        if (featureInputs.length > 0) {
            await featureInputs[0].clear();
            await featureInputs[0].sendKeys(TEST_FEATURE_NAME);
        }

        // 4. Selecionar o sistema no dropdown
        const systemSelect = await waitForElement(driver, By.css('.inline-add select.form-input'));
        await systemSelect.click();
        await driver.sleep(300);

        // Buscar a opção com o sistema criado
        const options = await systemSelect.findElements(By.tagName('option'));
        for (const option of options) {
            const text = await option.getText();
            if (text.includes(TEST_SYSTEM_NAME)) {
                await option.click();
                break;
            }
        }
        await driver.sleep(300);

        // 5. Clicar no botão Adicionar
        await clickElement(driver, By.xpath("//button[contains(@class, 'btn-primary') and contains(text(), 'Adicionar')]"));
        await driver.sleep(1000);

        // 6. Validação na Interface - Verificar se a feature aparece na lista
        await waitForText(driver, TEST_FEATURE_NAME);
        log.success('Interface: Feature criada e visível na lista');

        // 7. Validação no Banco de Dados
        const dbResult = await findFeatureByTitle(TEST_FEATURE_NAME);
        if (dbResult.exists) {
            log.success(`Banco de Dados: Feature encontrada (ID: ${dbResult.data.id}, System ID: ${dbResult.data.system_id})`);
            testsPassed++;
        } else {
            log.error('Banco de Dados: Feature NÃO encontrada');
            testsFailed++;
        }

    } catch (error) {
        log.error(`Erro ao criar feature: ${error.message}`);
        testsFailed++;
    }
}

async function testValidateFeatureInList() {
    log.info('Teste: Validar Feature na Lista');

    try {
        // 1. Garantir que está na aba Features
        await navigateTo(driver, '/config');
        await driver.sleep(1000);

        const featuresTab = await waitForElement(driver, By.xpath("//button[contains(@class, 'tab') and contains(text(), 'Features')]"));
        await featuresTab.click();
        await driver.sleep(500);

        // 2. Buscar a feature na lista
        const listItems = await findElements(driver, By.css('.list-item'));
        let featureFoundInList = false;
        let featureId = null;
        let associatedSystem = null;

        for (const item of listItems) {
            const itemText = await item.getText();
            if (itemText.includes(TEST_FEATURE_NAME)) {
                featureFoundInList = true;
                
                // Extrair ID
                const idMatch = itemText.match(/#(\d+)/);
                if (idMatch) {
                    featureId = idMatch[1];
                }
                
                // Verificar se tem o sistema associado
                if (itemText.includes(TEST_SYSTEM_NAME)) {
                    associatedSystem = TEST_SYSTEM_NAME;
                }
                break;
            }
        }

        if (featureFoundInList) {
            log.success(`Interface: Feature "${TEST_FEATURE_NAME}" encontrada na lista (ID: ${featureId})`);
            if (associatedSystem) {
                log.success(`Interface: Feature associada ao sistema "${associatedSystem}"`);
            }
            testsPassed++;
        } else {
            log.error(`Interface: Feature "${TEST_FEATURE_NAME}" NÃO encontrada na lista`);
            testsFailed++;
        }

    } catch (error) {
        log.error(`Erro ao validar feature na lista: ${error.message}`);
        testsFailed++;
    }
}

// ========== CLEANUP ==========

async function cleanup() {
    log.info('Executando cleanup dos dados de teste...');
    
    try {
        // Remover feature primeiro (tem FK para sistema)
        const featureDeleted = await deleteFeatureByTitle(TEST_FEATURE_NAME);
        if (featureDeleted) {
            log.success('Cleanup: Feature de teste removida do banco');
        }

        // Remover sistema
        const systemDeleted = await deleteSystemByTitle(TEST_SYSTEM_NAME);
        if (systemDeleted) {
            log.success('Cleanup: Sistema de teste removido do banco');
        }

    } catch (error) {
        log.error(`Erro no cleanup: ${error.message}`);
    }
}

// ========== EXECUÇÃO DOS TESTES ==========

async function runTests() {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║   TESTES WEB: FEATURE                                 ║');
    console.log('╚═══════════════════════════════════════════════════════╝');

    try {
        // Inicializar driver
        log.info('Inicializando WebDriver...');
        driver = await createDriver();
        log.success('WebDriver inicializado');

        // Setup
        log.section('SETUP');
        await setup();

        // Executar testes
        log.section('CRIAR FEATURE');
        await testCreateFeature();

        log.section('VALIDAR FEATURE NA LISTA');
        await testValidateFeatureInList();

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
    console.log('║   RESUMO: TESTES DE FEATURE                           ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log(`\x1b[32m✓ Testes aprovados: ${testsPassed}\x1b[0m`);
    console.log(`\x1b[31m✗ Testes falhados: ${testsFailed}\x1b[0m`);

    if (testsFailed > 0) {
        process.exit(1);
    }
}

// Executar
runTests();

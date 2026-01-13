/**
 * ====================================
 * CONFIGURAÇÃO DO SELENIUM WEBDRIVER
 * ====================================
 * Configuração centralizada para testes web
 */

const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

// Configurações
const CONFIG = {
    BASE_URL: process.env.WEB_URL || 'http://localhost:5174',
    TIMEOUT: 10000,
    IMPLICIT_WAIT: 5000
};

/**
 * Cria uma nova instância do WebDriver
 * @returns {Promise<WebDriver>}
 */
async function createDriver() {
    const options = new chrome.Options();
    
    // Configurações para rodar em ambiente Docker/CI
    if (process.env.HEADLESS === 'true') {
        options.addArguments('--headless');
    }
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');

    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    await driver.manage().setTimeouts({
        implicit: CONFIG.IMPLICIT_WAIT,
        pageLoad: CONFIG.TIMEOUT,
        script: CONFIG.TIMEOUT
    });

    return driver;
}

/**
 * Navega para uma página específica
 * @param {WebDriver} driver 
 * @param {string} path - Caminho relativo (ex: '/config')
 */
async function navigateTo(driver, path = '') {
    const url = `${CONFIG.BASE_URL}${path}`;
    await driver.get(url);
    await driver.sleep(500); // Aguarda carregamento inicial
}

/**
 * Aguarda um elemento estar visível e retorna ele
 * @param {WebDriver} driver 
 * @param {By} locator 
 * @param {number} timeout 
 * @returns {Promise<WebElement>}
 */
async function waitForElement(driver, locator, timeout = CONFIG.TIMEOUT) {
    return await driver.wait(until.elementLocated(locator), timeout);
}

/**
 * Aguarda um elemento estar visível e clicável
 * @param {WebDriver} driver 
 * @param {By} locator 
 * @param {number} timeout 
 * @returns {Promise<WebElement>}
 */
async function waitForClickable(driver, locator, timeout = CONFIG.TIMEOUT) {
    const element = await waitForElement(driver, locator, timeout);
    await driver.wait(until.elementIsVisible(element), timeout);
    await driver.wait(until.elementIsEnabled(element), timeout);
    return element;
}

/**
 * Preenche um campo de input
 * @param {WebDriver} driver 
 * @param {By} locator 
 * @param {string} text 
 */
async function fillInput(driver, locator, text) {
    const element = await waitForClickable(driver, locator);
    await element.clear();
    await element.sendKeys(text);
}

/**
 * Clica em um elemento
 * @param {WebDriver} driver 
 * @param {By} locator 
 */
async function clickElement(driver, locator) {
    const element = await waitForClickable(driver, locator);
    await element.click();
}

/**
 * Seleciona uma opção em um dropdown
 * @param {WebDriver} driver 
 * @param {By} locator 
 * @param {string} value - Valor ou texto da opção
 */
async function selectOption(driver, locator, value) {
    const select = await waitForClickable(driver, locator);
    await select.click();
    const option = await select.findElement(By.css(`option[value="${value}"]`));
    await option.click();
}

/**
 * Seleciona uma opção em um dropdown pelo texto visível
 * @param {WebDriver} driver 
 * @param {By} locator 
 * @param {string} text - Texto visível da opção
 */
async function selectOptionByText(driver, locator, text) {
    const select = await waitForClickable(driver, locator);
    await select.click();
    const option = await select.findElement(By.xpath(`./option[contains(text(), "${text}")]`));
    await option.click();
}

/**
 * Obtém o texto de um elemento
 * @param {WebDriver} driver 
 * @param {By} locator 
 * @returns {Promise<string>}
 */
async function getText(driver, locator) {
    const element = await waitForElement(driver, locator);
    return await element.getText();
}

/**
 * Verifica se um elemento existe na página
 * @param {WebDriver} driver 
 * @param {By} locator 
 * @returns {Promise<boolean>}
 */
async function elementExists(driver, locator) {
    try {
        await driver.findElement(locator);
        return true;
    } catch {
        return false;
    }
}

/**
 * Aguarda a página carregar completamente
 * @param {WebDriver} driver 
 */
async function waitForPageLoad(driver) {
    await driver.wait(async () => {
        const readyState = await driver.executeScript('return document.readyState');
        return readyState === 'complete';
    }, CONFIG.TIMEOUT);
}

/**
 * Obtém todos os elementos que correspondem ao locator
 * @param {WebDriver} driver 
 * @param {By} locator 
 * @returns {Promise<WebElement[]>}
 */
async function findElements(driver, locator) {
    return await driver.findElements(locator);
}

/**
 * Aguarda até que um texto apareça na página
 * @param {WebDriver} driver 
 * @param {string} text 
 * @param {number} timeout 
 */
async function waitForText(driver, text, timeout = CONFIG.TIMEOUT) {
    await driver.wait(async () => {
        const body = await driver.findElement(By.tagName('body'));
        const bodyText = await body.getText();
        return bodyText.includes(text);
    }, timeout);
}

/**
 * Fecha o driver
 * @param {WebDriver} driver 
 */
async function closeDriver(driver) {
    if (driver) {
        await driver.quit();
    }
}

// Utilitário para logs coloridos
const log = {
    success: (msg) => console.log('✅️', msg),
    error: (msg) => console.log('❌', msg),
    info: (msg) => console.log('ℹ️', msg),
    section: (msg) => console.log('\n=====', msg, '====='),
    warn: (msg) => console.log('⚠️', msg)
};

module.exports = {
    CONFIG,
    By,
    until,
    createDriver,
    navigateTo,
    waitForElement,
    waitForClickable,
    fillInput,
    clickElement,
    selectOption,
    selectOptionByText,
    getText,
    elementExists,
    waitForPageLoad,
    findElements,
    waitForText,
    closeDriver,
    log
};

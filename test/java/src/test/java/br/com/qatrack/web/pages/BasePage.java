package br.com.qatrack.web.pages;

import br.com.qatrack.shared.config.TestConfig;
import br.com.qatrack.shared.hooks.Hooks;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;

/**
 * Classe base para Page Objects
 * Contem metodos utilitarios comuns para todas as paginas
 * QA Track - v1.0.0
 */
public abstract class BasePage {

    protected WebDriver driver;
    protected WebDriverWait wait;

    /**
     * Construtor padrao - obtem driver dos Hooks
     */
    public BasePage() {
        this.driver = Hooks.getDriver();
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(TestConfig.DEFAULT_TIMEOUT));
    }

    /**
     * Navega para uma URL relativa
     * @param path Caminho relativo (ex: "/config")
     */
    protected void navigateTo(String path) {
        String url = TestConfig.WEB_BASE_URL + path;
        driver.get(url);
        waitForPageLoad();
    }

    /**
     * Aguarda ate que um elemento esteja visivel
     * @param locator Localizador do elemento
     * @return WebElement encontrado
     */
    protected WebElement waitForElement(By locator) {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    /**
     * Aguarda ate que um elemento esteja clicavel
     * @param locator Localizador do elemento
     * @return WebElement clicavel
     */
    protected WebElement waitForClickable(By locator) {
        return wait.until(ExpectedConditions.elementToBeClickable(locator));
    }

    /**
     * Clica em um elemento
     * @param locator Localizador do elemento
     */
    protected void click(By locator) {
        waitForClickable(locator).click();
    }

    /**
     * Preenche um campo de texto
     * @param locator Localizador do elemento
     * @param text Texto a ser digitado
     */
    protected void type(By locator, String text) {
        WebElement element = waitForElement(locator);
        element.clear();
        element.sendKeys(text);
    }

    /**
     * Obtem o texto de um elemento
     * @param locator Localizador do elemento
     * @return Texto do elemento
     */
    protected String getText(By locator) {
        return waitForElement(locator).getText();
    }

    /**
     * Verifica se um elemento esta visivel
     * @param locator Localizador do elemento
     * @return true se visivel
     */
    protected boolean isElementVisible(By locator) {
        try {
            return waitForElement(locator).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Verifica se um texto esta presente na pagina
     * @param text Texto a ser procurado
     * @return true se encontrado
     */
    protected boolean isTextPresent(String text) {
        try {
            return wait.until(ExpectedConditions.textToBePresentInElementLocated(
                By.tagName("body"), text
            ));
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Aguarda o carregamento completo da pagina
     */
    protected void waitForPageLoad() {
        wait.until(webDriver -> 
            ((JavascriptExecutor) webDriver).executeScript("return document.readyState").equals("complete")
        );
    }

    /**
     * Encontra todos os elementos que correspondem ao localizador
     * @param locator Localizador dos elementos
     * @return Lista de elementos
     */
    protected List<WebElement> findElements(By locator) {
        return driver.findElements(locator);
    }

    /**
     * Executa JavaScript na pagina
     * @param script Script JavaScript
     * @param args Argumentos opcionais
     * @return Resultado da execucao
     */
    protected Object executeScript(String script, Object... args) {
        return ((JavascriptExecutor) driver).executeScript(script, args);
    }

    /**
     * Aguarda um tempo especifico (usar com moderacao)
     * @param milliseconds Tempo em milissegundos
     */
    protected void sleep(long milliseconds) {
        try {
            Thread.sleep(milliseconds);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /**
     * Obtem o titulo da pagina atual
     * @return Titulo da pagina
     */
    protected String getPageTitle() {
        return driver.getTitle();
    }

    /**
     * Obtem a URL atual
     * @return URL atual
     */
    protected String getCurrentUrl() {
        return driver.getCurrentUrl();
    }
}

package br.com.qatrack.shared.hooks;

import br.com.qatrack.shared.config.TestConfig;
import io.cucumber.java.After;
import io.cucumber.java.Before;
import io.cucumber.java.Scenario;
import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;

import java.time.Duration;

/**
 * Hooks do Cucumber para setup e teardown
 * QA Track - v1.0.0
 */
public class Hooks {

    private static WebDriver driver;
    private static boolean isWebTest = false;

    /**
     * Setup executado antes de cada cenario WEB
     * Inicializa o WebDriver apenas para testes com tag @WEB
     */
    @Before("@WEB")
    public void setupWebDriver(Scenario scenario) {
        isWebTest = true;
        System.out.println("\n[SETUP] Inicializando WebDriver para: " + scenario.getName());
        
        // Configura o WebDriverManager para baixar o ChromeDriver automaticamente
        WebDriverManager.chromedriver().setup();
        
        // Configura opcoes do Chrome
        ChromeOptions options = new ChromeOptions();
        
        // Modo headless para CI/CD
        if (TestConfig.HEADLESS) {
            options.addArguments("--headless=new");
            System.out.println("[CONFIG] Modo HEADLESS ativado");
        }
        
        // Argumentos necessarios para execucao em Docker/CI
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("--disable-gpu");
        options.addArguments("--window-size=" + TestConfig.BROWSER_WIDTH + "," + TestConfig.BROWSER_HEIGHT);
        options.addArguments("--disable-extensions");
        options.addArguments("--disable-infobars");
        
        // Inicializa o driver
        driver = new ChromeDriver(options);
        
        // Configura timeouts
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(TestConfig.IMPLICIT_WAIT));
        driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(TestConfig.PAGE_LOAD_TIMEOUT));
        
        System.out.println("[SETUP] WebDriver inicializado com sucesso");
    }

    /**
     * Setup executado antes de cada cenario API
     * Apenas log, nao precisa de WebDriver
     */
    @Before("@API")
    public void setupAPI(Scenario scenario) {
        isWebTest = false;
        System.out.println("\n[SETUP] Iniciando teste API: " + scenario.getName());
        System.out.println("[CONFIG] API_BASE_URL: " + TestConfig.API_BASE_URL);
    }

    /**
     * Teardown executado apos cada cenario WEB
     * Captura screenshot em caso de falha e fecha o navegador
     */
    @After("@WEB")
    public void teardownWebDriver(Scenario scenario) {
        if (driver != null) {
            // Captura screenshot se o cenario falhou
            if (scenario.isFailed()) {
                System.out.println("[TEARDOWN] Cenario falhou - capturando screenshot");
                try {
                    byte[] screenshot = ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES);
                    scenario.attach(screenshot, "image/png", "screenshot_falha");
                } catch (Exception e) {
                    System.out.println("[TEARDOWN] Erro ao capturar screenshot: " + e.getMessage());
                }
            }
            
            // Fecha o navegador
            driver.quit();
            driver = null;
            System.out.println("[TEARDOWN] WebDriver encerrado");
        }
    }

    /**
     * Teardown executado apos cada cenario API
     */
    @After("@API")
    public void teardownAPI(Scenario scenario) {
        if (scenario.isFailed()) {
            System.out.println("[TEARDOWN] Cenario API falhou: " + scenario.getName());
        } else {
            System.out.println("[TEARDOWN] Cenario API concluido com sucesso");
        }
    }

    /**
     * Retorna a instancia do WebDriver atual
     * @return WebDriver ou null se nao for teste WEB
     */
    public static WebDriver getDriver() {
        return driver;
    }

    /**
     * Verifica se o teste atual e um teste WEB
     * @return true se for teste WEB
     */
    public static boolean isWebTest() {
        return isWebTest;
    }
}

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
 * Cucumber Hooks for setup and teardown
 */
public class Hooks {

    private static WebDriver driver;
    private static boolean isWebTest = false;

    /**
     * Setup executed before each WEB scenario
     * Initializes WebDriver only for tests with @WEB tag
     */
    @Before("@WEB")
    public void setupWebDriver(Scenario scenario) {
        isWebTest = true;
        System.out.println("\n[SETUP] Initializing WebDriver for: " + scenario.getName());
        
        // Configures WebDriverManager to download ChromeDriver automatically
        WebDriverManager.chromedriver().setup();
        
        // Configure Chrome options
        ChromeOptions options = new ChromeOptions();
        
        // Headless mode for CI/CD
        if (TestConfig.HEADLESS) {
            options.addArguments("--headless=new");
            System.out.println("[CONFIG] HEADLESS mode enabled");
        }
        
        // Arguments required for Docker/CI execution
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("--disable-gpu");
        options.addArguments("--window-size=" + TestConfig.BROWSER_WIDTH + "," + TestConfig.BROWSER_HEIGHT);
        options.addArguments("--disable-extensions");
        options.addArguments("--disable-infobars");
        
        // Initialize the driver
        driver = new ChromeDriver(options);
        
        // Configure timeouts
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(TestConfig.IMPLICIT_WAIT));
        driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(TestConfig.PAGE_LOAD_TIMEOUT));
        
        System.out.println("[SETUP] WebDriver initialized successfully");
    }

    /**
     * Setup executed before each API scenario
     * Just logging, no WebDriver needed
     */
    @Before("@API")
    public void setupAPI(Scenario scenario) {
        isWebTest = false;
        System.out.println("\n[SETUP] Starting API test: " + scenario.getName());
        System.out.println("[CONFIG] API_BASE_URL: " + TestConfig.API_BASE_URL);
    }

    /**
     * Teardown executed after each WEB scenario
     * Captures screenshot on failure and closes the browser
     */
    @After("@WEB")
    public void teardownWebDriver(Scenario scenario) {
        if (driver != null) {
            // Capture screenshot if scenario failed
            if (scenario.isFailed()) {
                System.out.println("[TEARDOWN] Scenario failed - capturing screenshot");
                try {
                    byte[] screenshot = ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES);
                    scenario.attach(screenshot, "image/png", "failure_screenshot");
                } catch (Exception e) {
                    System.out.println("[TEARDOWN] Error capturing screenshot: " + e.getMessage());
                }
            }
            
            // Close the browser
            driver.quit();
            driver = null;
            System.out.println("[TEARDOWN] WebDriver closed");
        }
    }

    /**
     * Teardown executed after each API scenario
     */
    @After("@API")
    public void teardownAPI(Scenario scenario) {
        if (scenario.isFailed()) {
            System.out.println("[TEARDOWN] API scenario failed: " + scenario.getName());
        } else {
            System.out.println("[TEARDOWN] API scenario completed successfully");
        }
    }

    /**
     * Returns the current WebDriver instance
     * @return WebDriver or null if not a WEB test
     */
    public static WebDriver getDriver() {
        return driver;
    }

    /**
     * Checks if the current test is a WEB test
     * @return true if it's a WEB test
     */
    public static boolean isWebTest() {
        return isWebTest;
    }
}

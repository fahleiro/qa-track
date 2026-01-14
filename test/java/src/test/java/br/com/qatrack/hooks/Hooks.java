package br.com.qatrack.hooks;

import io.cucumber.java.After;
import io.cucumber.java.Before;
import io.cucumber.java.Scenario;
import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.WebDriverWait;

import br.com.qatrack.asserts.AssertHomePage;
import br.com.qatrack.utils.TestConfig;

import java.time.Duration;

public class Hooks {

    private static WebDriver driver;

    @Before()
    public void setupWebDriver(Scenario scenario) {
        System.out.println("\n[SETUP] Initializing WebDriver for: " + scenario.getName());
        
        WebDriverManager.chromedriver().setup();
        
        ChromeOptions options = new ChromeOptions();
        
        if (TestConfig.HEADLESS) {
            options.addArguments("--headless=new");
            System.out.println("[CONFIG] HEADLESS mode enabled");
        }
        
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("--disable-gpu");
        options.addArguments("--window-size=" + TestConfig.BROWSER_WIDTH + "," + TestConfig.BROWSER_HEIGHT);
        options.addArguments("--disable-extensions");
        options.addArguments("--disable-infobars");
        
        driver = new ChromeDriver(options);
        
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(TestConfig.IMPLICIT_WAIT));
        driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(TestConfig.PAGE_LOAD_TIMEOUT));
        
        System.out.println("[SETUP] WebDriver initialized successfully");
        
        driver.get(TestConfig.WEB_BASE_URL);
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(TestConfig.DEFAULT_TIMEOUT));
        wait.until(webDriver -> 
            ((JavascriptExecutor) webDriver).executeScript("return document.readyState").equals("complete")
        );
        System.out.println("[SETUP] Navigated to: " + TestConfig.WEB_BASE_URL);
        
        // Validate home page is loaded correctly
        AssertHomePage.validateHomePageLoaded(driver);
    }

    @After()
    public void teardownWebDriver(Scenario scenario) {
        if (driver != null) {
            if (scenario.isFailed()) {
                System.out.println("[TEARDOWN] Scenario failed - capturing screenshot");
                try {
                    byte[] screenshot = ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES);
                    scenario.attach(screenshot, "image/png", "failure_screenshot");
                } catch (Exception e) {
                    System.out.println("[TEARDOWN] Error capturing screenshot: " + e.getMessage());
                }
            }
            
            driver.quit();
            driver = null;
            System.out.println("[TEARDOWN] WebDriver closed");
        }
    }

    public static WebDriver getDriver() {
        return driver;
    }
}

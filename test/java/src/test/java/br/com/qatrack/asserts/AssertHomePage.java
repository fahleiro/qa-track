package br.com.qatrack.asserts;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import br.com.qatrack.utils.TestConfig;

import java.time.Duration;

import static org.junit.Assert.assertTrue;

public class AssertHomePage {

    private static final By HOME_TITLE = By.cssSelector(".home-title");
    private static final By HOME_VERSION = By.cssSelector(".home-version");
    private static final By HEADER_BRAND = By.cssSelector(".header-brand");

    public static void validateHomePageLoaded(WebDriver driver) {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(TestConfig.DEFAULT_TIMEOUT));
        
        WebElement headerBrand = wait.until(ExpectedConditions.visibilityOfElementLocated(HEADER_BRAND));
        assertTrue("[ASSERT] Header brand 'QA Track' should be visible", 
            headerBrand.getText().contains("QA Track"));
        
        WebElement homeTitle = wait.until(ExpectedConditions.visibilityOfElementLocated(HOME_TITLE));
        assertTrue("[ASSERT] Home title 'QA Track' should be visible", 
            homeTitle.getText().equals("QA Track"));
        
        WebElement homeVersion = wait.until(ExpectedConditions.visibilityOfElementLocated(HOME_VERSION));
        assertTrue("[ASSERT] Version '0.1.0' should be visible", 
            homeVersion.getText().equals("0.1.0"));
        
        System.out.println("[ASSERT] Home page validated successfully - Title: QA Track, Version: 0.1.0");
    }
}

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
 * Base class for Page Objects
 * Contains common utility methods for all pages
 * QA Track - v1.0.0
 */
public abstract class BasePage {

    protected WebDriver driver;
    protected WebDriverWait wait;

    /**
     * Default constructor - gets driver from Hooks
     */
    public BasePage() {
        this.driver = Hooks.getDriver();
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(TestConfig.DEFAULT_TIMEOUT));
    }

    /**
     * Navigates to a relative URL
     * @param path Relative path (e.g.: "/config")
     */
    protected void navigateTo(String path) {
        String url = TestConfig.WEB_BASE_URL + path;
        driver.get(url);
        waitForPageLoad();
    }

    /**
     * Waits until an element is visible
     * @param locator Element locator
     * @return Found WebElement
     */
    protected WebElement waitForElement(By locator) {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    /**
     * Waits until an element is clickable
     * @param locator Element locator
     * @return Clickable WebElement
     */
    protected WebElement waitForClickable(By locator) {
        return wait.until(ExpectedConditions.elementToBeClickable(locator));
    }

    /**
     * Clicks on an element
     * @param locator Element locator
     */
    protected void click(By locator) {
        waitForClickable(locator).click();
    }

    /**
     * Fills a text field
     * @param locator Element locator
     * @param text Text to type
     */
    protected void type(By locator, String text) {
        WebElement element = waitForElement(locator);
        element.clear();
        element.sendKeys(text);
    }

    /**
     * Gets the text of an element
     * @param locator Element locator
     * @return Element text
     */
    protected String getText(By locator) {
        return waitForElement(locator).getText();
    }

    /**
     * Checks if an element is visible
     * @param locator Element locator
     * @return true if visible
     */
    protected boolean isElementVisible(By locator) {
        try {
            return waitForElement(locator).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Checks if a text is present on the page
     * @param text Text to search for
     * @return true if found
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
     * Waits for the page to fully load
     */
    protected void waitForPageLoad() {
        wait.until(webDriver -> 
            ((JavascriptExecutor) webDriver).executeScript("return document.readyState").equals("complete")
        );
    }

    /**
     * Finds all elements matching the locator
     * @param locator Elements locator
     * @return List of elements
     */
    protected List<WebElement> findElements(By locator) {
        return driver.findElements(locator);
    }

    /**
     * Executes JavaScript on the page
     * @param script JavaScript script
     * @param args Optional arguments
     * @return Execution result
     */
    protected Object executeScript(String script, Object... args) {
        return ((JavascriptExecutor) driver).executeScript(script, args);
    }

    /**
     * Waits for a specific time (use sparingly)
     * @param milliseconds Time in milliseconds
     */
    protected void sleep(long milliseconds) {
        try {
            Thread.sleep(milliseconds);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /**
     * Gets the current page title
     * @return Page title
     */
    protected String getPageTitle() {
        return driver.getTitle();
    }

    /**
     * Gets the current URL
     * @return Current URL
     */
    protected String getCurrentUrl() {
        return driver.getCurrentUrl();
    }
}

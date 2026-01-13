package br.com.qatrack.web.pages;

import org.openqa.selenium.By;

/**
 * Page Object for the Home page
 * Starting point for all WEB tests
 * QA Track - v1.0.0
 */
public class HomePage extends BasePage {

    // ========================================
    // Locators - Navigation Menu
    // ========================================
    
    private static final By MENU_SCENARIOS = By.xpath("//nav[@class='header-nav']//a[contains(text(), 'Cenários')]");
    private static final By MENU_SETTINGS = By.xpath("//nav[@class='header-nav']//a[contains(text(), 'Configuração')]");
    private static final By HEADER_BRAND = By.cssSelector(".header-brand");

    // ========================================
    // Actions
    // ========================================
    
    /**
     * Opens the application home page
     */
    public void openHomePage() {
        navigateTo("/");
        waitForPageLoad();
        sleep(500);
        System.out.println("[WEB] Home page opened: " + getCurrentUrl());
    }

    /**
     * Navigates to the Settings page via menu
     */
    public void navigateToConfigPage() {
        click(MENU_SETTINGS);
        waitForPageLoad();
        sleep(500);
        System.out.println("[WEB] Navigated to Settings via menu");
    }

    /**
     * Navigates to the Scenarios page via menu
     */
    public void navigateToScenariosPage() {
        click(MENU_SCENARIOS);
        waitForPageLoad();
        sleep(500);
        System.out.println("[WEB] Navigated to Scenarios via menu");
    }

    // ========================================
    // Validations
    // ========================================
    
    /**
     * Checks if the home page has loaded
     * @return true if loaded
     */
    public boolean isHomePageLoaded() {
        return isElementVisible(HEADER_BRAND) && isElementVisible(MENU_SCENARIOS);
    }

    /**
     * Checks if the navigation menu is visible
     * @return true if visible
     */
    public boolean isNavigationMenuVisible() {
        return isElementVisible(MENU_SCENARIOS) && isElementVisible(MENU_SETTINGS);
    }
}

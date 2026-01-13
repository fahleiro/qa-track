package br.com.qatrack.pages;

import org.openqa.selenium.By;

public class HomePage extends BasePage {

    private static final By MENU_SCENARIOS = By.xpath("//nav[@class='header-nav']//a[contains(text(), 'Cenários')]");
    private static final By MENU_SETTINGS = By.xpath("//nav[@class='header-nav']//a[contains(text(), 'Configuração')]");
    private static final By HEADER_BRAND = By.cssSelector(".header-brand");

    public void openHomePage() {
        navigateTo("/");
        waitForPageLoad();
        sleep(500);
        System.out.println("[WEB] Home page opened: " + getCurrentUrl());
    }

    public void navigateToConfigPage() {
        click(MENU_SETTINGS);
        waitForPageLoad();
        sleep(500);
        System.out.println("[WEB] Navigated to Settings via menu");
    }

    public void navigateToScenariosPage() {
        click(MENU_SCENARIOS);
        waitForPageLoad();
        sleep(500);
        System.out.println("[WEB] Navigated to Scenarios via menu");
    }

    public boolean isHomePageLoaded() {
        return isElementVisible(HEADER_BRAND) && isElementVisible(MENU_SCENARIOS);
    }

    public boolean isNavigationMenuVisible() {
        return isElementVisible(MENU_SCENARIOS) && isElementVisible(MENU_SETTINGS);
    }
}

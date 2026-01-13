package br.com.qatrack.interactions;

import br.com.qatrack.pages.ConfigPage;
import br.com.qatrack.pages.HomePage;

import static org.junit.Assert.*;

public class SystemInteractions {

    private HomePage homePage;
    private ConfigPage configPage;

    public void initializePages() {
        homePage = new HomePage();
        configPage = new ConfigPage();
    }

    public void openHomePage() {
        homePage.openHomePage();
        System.out.println("[WEB] Home page opened");
    }

    public void validateHomePageLoaded() {
        assertTrue(
            "Home page should be loaded",
            homePage.isHomePageLoaded()
        );
        System.out.println("[WEB] Home page loaded successfully");
    }

    public void navigateToConfigPage() {
        homePage.navigateToConfigPage();
        System.out.println("[WEB] Navigated to settings page via menu");
    }

    public void validateSettingsPageLoaded() {
        assertTrue(
            "Settings page should be loaded",
            configPage.isPageLoaded()
        );
        System.out.println("[WEB] Settings page loaded successfully");
    }

    public void clickSystemsTab() {
        configPage.clickSystemsTab();
        System.out.println("[WEB] 'Systems' tab selected");
    }

    public void clickStatusTab() {
        configPage.clickStatusTab();
        System.out.println("[WEB] 'Status' tab selected");
    }

    public void clickTab(String tabName) {
        switch (tabName.toLowerCase()) {
            case "systems":
            case "sistemas":
                clickSystemsTab();
                break;
            case "status":
                clickStatusTab();
                break;
            default:
                fail("Unknown tab: " + tabName);
        }
    }

    public void fillNewItemField(String text) {
        configPage.fillNewItemField(text);
        System.out.println("[WEB] Field filled with: " + text);
    }

    public void clickAddButton() {
        configPage.clickAddButton();
        System.out.println("[WEB] 'Add' button clicked");
    }

    public void clickButton(String buttonName) {
        if (buttonName.equalsIgnoreCase("Add") || buttonName.equalsIgnoreCase("Adicionar")) {
            clickAddButton();
        } else {
            fail("Unknown button: " + buttonName);
        }
    }

    public void createSystem(String systemName) {
        configPage.createSystem(systemName);
        System.out.println("[WEB] System '" + systemName + "' created");
    }

    public void validateSystemInList(String systemName) {
        boolean found = configPage.waitForItemInList(systemName);
        assertTrue(
            "System '" + systemName + "' should appear in the list",
            found
        );
        System.out.println("[WEB] System '" + systemName + "' found in list");
    }

    public void validateItemInList(String itemName) {
        boolean found = configPage.itemExistsInList(itemName);
        assertTrue(
            "Item '" + itemName + "' should exist in the list",
            found
        );
        System.out.println("[WEB] Item '" + itemName + "' verified in list");
    }

    public void validateMinimumItemCount(int minimumQuantity) {
        int count = configPage.countItemsInList();
        assertTrue(
            "List should contain at least " + minimumQuantity + " item(s), but contains " + count,
            count >= minimumQuantity
        );
        System.out.println("[WEB] List contains " + count + " item(s)");
    }

    public ConfigPage getConfigPage() {
        return configPage;
    }

    public HomePage getHomePage() {
        return homePage;
    }
}

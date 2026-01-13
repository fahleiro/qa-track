package br.com.qatrack.web.interactions;

import br.com.qatrack.web.pages.ConfigPage;
import br.com.qatrack.web.pages.HomePage;

import static org.junit.Assert.*;

/**
 * WEB interactions with System functionality
 * Contains all interface interaction logic
 * QA Track - v1.0.0
 */
public class SystemWEBInteractions {

    private HomePage homePage;
    private ConfigPage configPage;

    /**
     * Initializes the required pages
     */
    public void initializePages() {
        homePage = new HomePage();
        configPage = new ConfigPage();
    }

    /**
     * Opens the application home page
     */
    public void openHomePage() {
        homePage.openHomePage();
        System.out.println("[WEB] Home page opened");
    }

    /**
     * Validates that the home page has loaded
     */
    public void validateHomePageLoaded() {
        assertTrue(
            "Home page should be loaded",
            homePage.isHomePageLoaded()
        );
        System.out.println("[WEB] Home page loaded successfully");
    }

    /**
     * Navigates to the settings page via menu
     */
    public void navigateToConfigPage() {
        homePage.navigateToConfigPage();
        System.out.println("[WEB] Navigated to settings page via menu");
    }

    /**
     * Validates that the settings page has loaded
     */
    public void validateSettingsPageLoaded() {
        assertTrue(
            "Settings page should be loaded",
            configPage.isPageLoaded()
        );
        System.out.println("[WEB] Settings page loaded successfully");
    }

    /**
     * Clicks on the Systems tab
     */
    public void clickSystemsTab() {
        configPage.clickSystemsTab();
        System.out.println("[WEB] 'Systems' tab selected");
    }

    /**
     * Clicks on the Status tab
     */
    public void clickStatusTab() {
        configPage.clickStatusTab();
        System.out.println("[WEB] 'Status' tab selected");
    }

    /**
     * Clicks on a tab by name
     * @param tabName Tab name
     */
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

    /**
     * Fills the new item field
     * @param text Text to fill
     */
    public void fillNewItemField(String text) {
        configPage.fillNewItemField(text);
        System.out.println("[WEB] Field filled with: " + text);
    }

    /**
     * Clicks the Add button
     */
    public void clickAddButton() {
        configPage.clickAddButton();
        System.out.println("[WEB] 'Add' button clicked");
    }

    /**
     * Clicks a button by name
     * @param buttonName Button name
     */
    public void clickButton(String buttonName) {
        if (buttonName.equalsIgnoreCase("Add") || buttonName.equalsIgnoreCase("Adicionar")) {
            clickAddButton();
        } else {
            fail("Unknown button: " + buttonName);
        }
    }

    /**
     * Creates a new system
     * @param systemName System name
     */
    public void createSystem(String systemName) {
        configPage.createSystem(systemName);
        System.out.println("[WEB] System '" + systemName + "' created");
    }

    /**
     * Validates that a system exists in the list
     * @param systemName System name
     */
    public void validateSystemInList(String systemName) {
        boolean found = configPage.waitForItemInList(systemName);
        assertTrue(
            "System '" + systemName + "' should appear in the list",
            found
        );
        System.out.println("[WEB] System '" + systemName + "' found in list");
    }

    /**
     * Validates that an item exists in the list
     * @param itemName Item name
     */
    public void validateItemInList(String itemName) {
        boolean found = configPage.itemExistsInList(itemName);
        assertTrue(
            "Item '" + itemName + "' should exist in the list",
            found
        );
        System.out.println("[WEB] Item '" + itemName + "' verified in list");
    }

    /**
     * Validates minimum item count in the list
     * @param minimumQuantity Expected minimum quantity
     */
    public void validateMinimumItemCount(int minimumQuantity) {
        int count = configPage.countItemsInList();
        assertTrue(
            "List should contain at least " + minimumQuantity + " item(s), but contains " + count,
            count >= minimumQuantity
        );
        System.out.println("[WEB] List contains " + count + " item(s)");
    }

    /**
     * Gets the settings page
     * @return ConfigPage
     */
    public ConfigPage getConfigPage() {
        return configPage;
    }

    /**
     * Gets the home page
     * @return HomePage
     */
    public HomePage getHomePage() {
        return homePage;
    }
}

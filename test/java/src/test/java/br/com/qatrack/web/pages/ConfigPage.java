package br.com.qatrack.web.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;

import java.util.List;

/**
 * Page Object for the Settings page
 * QA Track - v1.0.0
 */
public class ConfigPage extends BasePage {

    // ========================================
    // Locators
    // ========================================
    
    // Tabs
    private static final By TAB_SYSTEMS = By.xpath("//button[contains(@class, 'tab') and contains(text(), 'Sistemas')]");
    private static final By TAB_STATUS = By.xpath("//button[contains(@class, 'tab') and contains(text(), 'Status')]");
    
    // Add form
    private static final By INPUT_NEW_ITEM = By.cssSelector(".inline-add input.form-input");
    private static final By BTN_ADD = By.xpath("//button[contains(@class, 'btn-primary') and contains(text(), 'Adicionar')]");
    
    // Item list
    private static final By LIST_ITEMS = By.cssSelector(".list-item");

    // ========================================
    // Actions
    // ========================================

    /**
     * Clicks on the Systems tab
     */
    public void clickSystemsTab() {
        click(TAB_SYSTEMS);
        sleep(300);
    }

    /**
     * Clicks on the Status tab
     */
    public void clickStatusTab() {
        click(TAB_STATUS);
        sleep(300);
    }

    /**
     * Fills the new system/item field
     * @param text Text to fill
     */
    public void fillNewItemField(String text) {
        type(INPUT_NEW_ITEM, text);
    }

    /**
     * Clicks the Add button
     */
    public void clickAddButton() {
        click(BTN_ADD);
        sleep(1000);
    }

    /**
     * Creates a new system
     * @param systemName Name of the system to create
     */
    public void createSystem(String systemName) {
        clickSystemsTab();
        fillNewItemField(systemName);
        clickAddButton();
    }

    // ========================================
    // Validations
    // ========================================
    
    /**
     * Checks if an item is present in the list
     * @param text Text of the item to search for
     * @return true if found
     */
    public boolean itemExistsInList(String text) {
        List<WebElement> items = findElements(LIST_ITEMS);
        for (WebElement item : items) {
            String itemText = item.getText();
            if (itemText.contains(text)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Waits until an item appears in the list
     * @param text Text of the expected item
     * @return true if found within timeout
     */
    public boolean waitForItemInList(String text) {
        int attempts = 10;
        while (attempts > 0) {
            if (itemExistsInList(text)) {
                return true;
            }
            sleep(500);
            attempts--;
        }
        return false;
    }

    /**
     * Gets the item count in the list
     * @return Number of items
     */
    public int countItemsInList() {
        return findElements(LIST_ITEMS).size();
    }

    /**
     * Checks if the settings page has loaded
     * @return true if loaded
     */
    public boolean isPageLoaded() {
        return isElementVisible(TAB_SYSTEMS) && isElementVisible(TAB_STATUS);
    }
}

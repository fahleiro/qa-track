package br.com.qatrack.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;

import java.util.List;

public class ConfigPage extends BasePage {


    private static final By TAB_SYSTEMS = By.xpath("//button[contains(@class, 'tab') and contains(text(), 'Sistemas')]");
    private static final By TAB_STATUS = By.xpath("//button[contains(@class, 'tab') and contains(text(), 'Status')]");
    

    private static final By INPUT_NEW_ITEM = By.cssSelector(".inline-add input.form-input");
    private static final By BTN_ADD = By.xpath("//button[contains(@class, 'btn-primary') and contains(text(), 'Adicionar')]");
    

    private static final By LIST_ITEMS = By.cssSelector(".list-item");

    public void clickSystemsTab() {
        click(TAB_SYSTEMS);
        sleep(300);
    }

    public void clickStatusTab() {
        click(TAB_STATUS);
        sleep(300);
    }

    public void fillNewItemField(String text) {
        type(INPUT_NEW_ITEM, text);
    }

    public void clickAddButton() {
        click(BTN_ADD);
        sleep(1000);
    }

    public void createSystem(String systemName) {
        clickSystemsTab();
        fillNewItemField(systemName);
        clickAddButton();
    }

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

    public int countItemsInList() {
        return findElements(LIST_ITEMS).size();
    }

    public boolean isPageLoaded() {
        return isElementVisible(TAB_SYSTEMS) && isElementVisible(TAB_STATUS);
    }
}

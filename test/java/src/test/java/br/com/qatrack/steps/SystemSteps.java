package br.com.qatrack.steps;

import br.com.qatrack.interactions.SystemInteractions;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import io.cucumber.java.en.And;

public class SystemSteps {

    private final SystemInteractions webInteractions = new SystemInteractions();

    @Given("I am on the home page")
    public void iAmOnTheHomePage() {
        webInteractions.initializePages();
        webInteractions.openHomePage();
        webInteractions.validateHomePageLoaded();
    }

    @Given("I am on the settings page")
    public void iAmOnTheSettingsPage() {
        webInteractions.initializePages();
        webInteractions.openHomePage();
        webInteractions.validateHomePageLoaded();
        webInteractions.navigateToConfigPage();
        webInteractions.validateSettingsPageLoaded();
    }

    @When("I navigate to the settings page")
    public void iNavigateToTheSettingsPage() {
        webInteractions.navigateToConfigPage();
        webInteractions.validateSettingsPageLoaded();
    }

    @When("I click on the {string} tab")
    public void iClickOnTheTab(String tabName) {
        webInteractions.clickTab(tabName);
    }

    @And("I fill in the system field with {string}")
    public void iFillInTheSystemFieldWith(String systemName) {
        webInteractions.fillNewItemField(systemName);
    }

    @And("I click the {string} button")
    public void iClickTheButton(String buttonName) {
        webInteractions.clickButton(buttonName);
    }

    @Then("the system {string} should appear in the list")
    public void theSystemShouldAppearInTheList(String systemName) {
        webInteractions.validateSystemInList(systemName);
    }

    @Then("the item {string} should exist in the list")
    public void theItemShouldExistInTheList(String itemName) {
        webInteractions.validateItemInList(itemName);
    }

    @Then("the list should contain at least {int} item(s)")
    public void theListShouldContainAtLeastItems(int minimumQuantity) {
        webInteractions.validateMinimumItemCount(minimumQuantity);
    }

    @When("I create a new system with name {string}")
    public void iCreateANewSystemWithName(String systemName) {
        webInteractions.createSystem(systemName);
    }
}

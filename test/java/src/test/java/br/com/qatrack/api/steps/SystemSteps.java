package br.com.qatrack.api.steps;

import br.com.qatrack.api.interactions.SystemInteractions;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import io.cucumber.java.en.And;

/**
 * Step Definitions for API tests - System
 * Only maps steps to Interactions calls
 */
public class SystemSteps {

    private final SystemInteractions apiInteractions = new SystemInteractions();

    @Given("the API is available")
    public void theAPIIsAvailable() {
        apiInteractions.configureAPI();
    }

    @When("I make a GET request to {string}")
    public void iMakeAGETRequestTo(String endpoint) {
        apiInteractions.executeGET(endpoint);
    }

    @When("I make a POST request to {string} with body:")
    public void iMakeAPOSTRequestToWithBody(String endpoint, String body) {
        apiInteractions.executePOST(endpoint, body);
    }

    @Then("the status code should be {int}")
    public void theStatusCodeShouldBe(int expectedStatusCode) {
        apiInteractions.validateStatusCode(expectedStatusCode);
    }

    @And("the response should be a JSON list")
    public void theResponseShouldBeAJSONList() {
        apiInteractions.validateResponseIsJSONList();
    }

    @And("the response should be a JSON object")
    public void theResponseShouldBeAJSONObject() {
        apiInteractions.validateResponseIsJSONObject();
    }

    @And("the response should contain the field {string}")
    public void theResponseShouldContainTheField(String field) {
        apiInteractions.validateFieldExists(field);
    }

    @And("the field {string} should have the value {string}")
    public void theFieldShouldHaveTheValue(String field, String expectedValue) {
        apiInteractions.validateFieldValue(field, expectedValue);
    }

    @And("the list should not be empty")
    public void theListShouldNotBeEmpty() {
        apiInteractions.validateListNotEmpty();
    }

    @And("I print the response")
    public void iPrintTheResponse() {
        apiInteractions.printResponse();
    }
}

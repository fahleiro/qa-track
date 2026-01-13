package br.com.qatrack.api.interactions;

import br.com.qatrack.shared.config.TestConfig;
import io.restassured.RestAssured;
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;

import static io.restassured.RestAssured.given;
import static org.junit.Assert.*;

/**
 * Interactions with the System API
 * Contains all API communication logic
 */
public class SystemInteractions {

    private Response response;
    private RequestSpecification request;

    /**
     * Configures the API connection
     */
    public void configureAPI() {
        RestAssured.baseURI = TestConfig.API_BASE_URL;
        request = given()
            .contentType("application/json")
            .accept("application/json");
        
        System.out.println("[API] Base URI configured: " + TestConfig.API_BASE_URL);
    }

    /**
     * Executes a GET request
     * @param endpoint API endpoint
     */
    public void executeGET(String endpoint) {
        System.out.println("[API] Executing GET: " + endpoint);
        response = request.get(endpoint);
        System.out.println("[API] Status Code: " + response.getStatusCode());
    }

    /**
     * Executes a POST request with body
     * @param endpoint API endpoint
     * @param body Request body in JSON
     */
    public void executePOST(String endpoint, String body) {
        System.out.println("[API] Executing POST: " + endpoint);
        System.out.println("[API] Body: " + body);
        response = request.body(body).post(endpoint);
        System.out.println("[API] Status Code: " + response.getStatusCode());
    }

    /**
     * Executes a DELETE request
     * @param endpoint API endpoint
     */
    public void executeDELETE(String endpoint) {
        System.out.println("[API] Executing DELETE: " + endpoint);
        response = request.delete(endpoint);
        System.out.println("[API] Status Code: " + response.getStatusCode());
    }

    /**
     * Validates the response status code
     * @param expectedStatusCode Expected status code
     */
    public void validateStatusCode(int expectedStatusCode) {
        int actualStatusCode = response.getStatusCode();
        assertEquals(
            "Expected status code: " + expectedStatusCode + ", received: " + actualStatusCode,
            expectedStatusCode, 
            actualStatusCode
        );
        System.out.println("[API] Status code validated: " + actualStatusCode);
    }

    /**
     * Validates that the response is a JSON list
     */
    public void validateResponseIsJSONList() {
        String responseBody = response.getBody().asString();
        assertTrue(
            "Response should start with '[' (JSON array)",
            responseBody.trim().startsWith("[")
        );
        System.out.println("[API] Response is a valid JSON list");
    }

    /**
     * Validates that the response is a JSON object
     */
    public void validateResponseIsJSONObject() {
        String responseBody = response.getBody().asString();
        assertTrue(
            "Response should start with '{' (JSON object)",
            responseBody.trim().startsWith("{")
        );
        System.out.println("[API] Response is a valid JSON object");
    }

    /**
     * Validates that a field exists in the response
     * @param field Field name
     */
    public void validateFieldExists(String field) {
        Object value = response.jsonPath().get(field);
        assertNotNull("The field '" + field + "' should exist in the response", value);
        System.out.println("[API] Field '" + field + "' found: " + value);
    }

    /**
     * Validates the value of a field
     * @param field Field name
     * @param expectedValue Expected value
     */
    public void validateFieldValue(String field, String expectedValue) {
        String actualValue = response.jsonPath().getString(field);
        assertEquals(
            "Expected value for '" + field + "': " + expectedValue,
            expectedValue,
            actualValue
        );
        System.out.println("[API] Field '" + field + "' = '" + actualValue + "'");
    }

    /**
     * Validates that the list is not empty
     */
    public void validateListNotEmpty() {
        int size = response.jsonPath().getList("$").size();
        assertTrue("The list should contain at least 1 element", size > 0);
        System.out.println("[API] List contains " + size + " element(s)");
    }

    /**
     * Prints the response body
     */
    public void printResponse() {
        System.out.println("[API] Response Body:");
        System.out.println(response.getBody().prettyPrint());
    }

    /**
     * Gets the current response
     * @return Response
     */
    public Response getResponse() {
        return response;
    }
}

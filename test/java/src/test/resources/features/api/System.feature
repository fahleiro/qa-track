#language: en

@System
Feature: [API] /api/system

  @API @ListAllRegisteredSystems
  Scenario: List all registered systems
    Given the API is available
    When I make a GET request to "/api/system"
    Then the status code should be 200
    And the response should be a JSON list

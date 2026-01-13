# language: en

@WEB
Feature: [WEB] System Management via Web Interface

  @WEB @smoke
  Scenario: Create a new system via web interface
    Given I am on the home page
    When I navigate to the settings page
    And I click on the "Systems" tab
    And I fill in the system field with "Automated Test System"
    And I click the "Add" button
    Then the system "Automated Test System" should appear in the list

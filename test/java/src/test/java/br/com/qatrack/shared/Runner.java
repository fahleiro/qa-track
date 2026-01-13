package br.com.qatrack.shared;

import io.cucumber.junit.Cucumber;
import io.cucumber.junit.CucumberOptions;
import org.junit.runner.RunWith;

/**
 * Cucumber Runner for test execution
 * QA Track - v1.0.0
 * 
 * Usage:
 *   mvn clean test                                    # Run all tests
 *   mvn clean test -Dcucumber.filter.tags="@API"      # API tests only
 *   mvn clean test -Dcucumber.filter.tags="@WEB"      # WEB tests only
 *   mvn clean test -Dcucumber.filter.tags="@smoke"    # Smoke tests only
 *   HEADLESS=true mvn clean test                      # Headless mode (CI/CD)
 */
@RunWith(Cucumber.class)
@CucumberOptions(
        features = "src/test/resources/features",
        glue = {
            "br.com.qatrack.api.steps",
            "br.com.qatrack.web.steps",
            "br.com.qatrack.shared.hooks"
        },
        plugin = {
            "pretty",
            "junit:reports/cucumber.xml",
            "html:reports/cucumber.html",
            "json:reports/cucumber.json"
        },
        monochrome = true,
        snippets = CucumberOptions.SnippetType.UNDERSCORE
)
public class Runner {
}

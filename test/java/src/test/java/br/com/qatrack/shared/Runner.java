package br.com.qatrack.shared;

import io.cucumber.junit.Cucumber;
import io.cucumber.junit.CucumberOptions;
import org.junit.runner.RunWith;

/**
 * Runner do Cucumber para execucao dos testes
 * QA Track - v1.0.0
 * 
 * Uso:
 *   mvn clean test                                    # Executa todos os testes
 *   mvn clean test -Dcucumber.filter.tags="@API"      # Apenas testes API
 *   mvn clean test -Dcucumber.filter.tags="@WEB"      # Apenas testes WEB
 *   mvn clean test -Dcucumber.filter.tags="@smoke"    # Apenas testes smoke
 *   HEADLESS=true mvn clean test                      # Modo headless (CI/CD)
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

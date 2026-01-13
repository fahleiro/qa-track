package br.com.qatrack;

import io.cucumber.junit.Cucumber;
import io.cucumber.junit.CucumberOptions;
import org.junit.runner.RunWith;


@RunWith(Cucumber.class)
@CucumberOptions(
        features = "src/test/resources/features",
        glue = {
            "br.com.qatrack.steps",
            "br.com.qatrack.hooks"
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

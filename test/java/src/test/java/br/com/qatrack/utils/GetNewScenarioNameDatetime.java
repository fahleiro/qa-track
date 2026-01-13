package br.com.qatrack.utils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class GetNewScenarioNameDatetime {

    public static String getNewScenarioNameDatetime() {
        String scenarioName = "Scenario " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        return scenarioName;
    }
    
}

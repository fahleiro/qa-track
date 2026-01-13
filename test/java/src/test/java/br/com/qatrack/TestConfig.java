package br.com.qatrack;

/**
 * Centralized configurations for WEB automated tests
 */
public class TestConfig {

    public static final String WEB_BASE_URL = getEnvOrDefault("WEB_BASE_URL", "http://localhost:5174");


    public static final int DEFAULT_TIMEOUT = 10;

    public static final int PAGE_LOAD_TIMEOUT = 30;

    public static final int IMPLICIT_WAIT = 5;

    public static final boolean HEADLESS = Boolean.parseBoolean(getEnvOrDefault("HEADLESS", "false"));

    public static final int BROWSER_WIDTH = 1920;

    public static final int BROWSER_HEIGHT = 1080;

    private static String getEnvOrDefault(String envName, String defaultValue) {
        String value = System.getenv(envName);
        return (value != null && !value.isEmpty()) ? value : defaultValue;
    }

    public static void printConfig() {
        System.out.println("========================================");
        System.out.println("QA Track - WEB Test Configurations");
        System.out.println("========================================");
        System.out.println("WEB_BASE_URL: " + WEB_BASE_URL);
        System.out.println("HEADLESS: " + HEADLESS);
        System.out.println("DEFAULT_TIMEOUT: " + DEFAULT_TIMEOUT + "s");
        System.out.println("========================================");
    }
}

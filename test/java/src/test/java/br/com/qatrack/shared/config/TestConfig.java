package br.com.qatrack.shared.config;

/**
 * Centralized configurations for automated tests
 */
public class TestConfig {

    // ========================================
    // Base URLs
    // ========================================
    
    /**
     * API base URL
     * Can be overridden via API_BASE_URL environment variable
     */
    public static final String API_BASE_URL = getEnvOrDefault("API_BASE_URL", "http://localhost:3001");
    
    /**
     * Web Interface base URL
     * Can be overridden via WEB_BASE_URL environment variable
     */
    public static final String WEB_BASE_URL = getEnvOrDefault("WEB_BASE_URL", "http://localhost:5174");

    // ========================================
    // Timeouts (in seconds)
    // ========================================
    
    /**
     * Default timeout for waiting for elements
     */
    public static final int DEFAULT_TIMEOUT = 10;
    
    /**
     * Page load timeout
     */
    public static final int PAGE_LOAD_TIMEOUT = 30;
    
    /**
     * WebDriver implicit wait timeout
     */
    public static final int IMPLICIT_WAIT = 5;

    // ========================================
    // Browser Settings
    // ========================================
    
    /**
     * Checks if it should run in headless mode
     * Enabled via HEADLESS=true environment variable
     */
    public static final boolean HEADLESS = Boolean.parseBoolean(getEnvOrDefault("HEADLESS", "false"));
    
    /**
     * Browser window width
     */
    public static final int BROWSER_WIDTH = 1920;
    
    /**
     * Browser window height
     */
    public static final int BROWSER_HEIGHT = 1080;

    // ========================================
    // Utility Methods
    // ========================================
    
    /**
     * Gets environment variable value or returns default value
     * @param envName Environment variable name
     * @param defaultValue Default value if variable doesn't exist
     * @return Variable value or default value
     */
    private static String getEnvOrDefault(String envName, String defaultValue) {
        String value = System.getenv(envName);
        return (value != null && !value.isEmpty()) ? value : defaultValue;
    }
    
    /**
     * Prints current configurations (useful for debugging)
     */
    public static void printConfig() {
        System.out.println("========================================");
        System.out.println("QA Track - Test Configurations");
        System.out.println("========================================");
        System.out.println("API_BASE_URL: " + API_BASE_URL);
        System.out.println("WEB_BASE_URL: " + WEB_BASE_URL);
        System.out.println("HEADLESS: " + HEADLESS);
        System.out.println("DEFAULT_TIMEOUT: " + DEFAULT_TIMEOUT + "s");
        System.out.println("========================================");
    }
}

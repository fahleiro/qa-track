package br.com.qatrack.shared.config;

/**
 * Configuracoes centralizadas para os testes automatizados
 * QA Track - v1.0.0
 */
public class TestConfig {

    // ========================================
    // URLs Base
    // ========================================
    
    /**
     * URL base da API
     * Pode ser sobrescrita via variavel de ambiente API_BASE_URL
     */
    public static final String API_BASE_URL = getEnvOrDefault("API_BASE_URL", "http://localhost:3000");
    
    /**
     * URL base da Interface Web
     * Pode ser sobrescrita via variavel de ambiente WEB_BASE_URL
     */
    public static final String WEB_BASE_URL = getEnvOrDefault("WEB_BASE_URL", "http://localhost:5174");

    // ========================================
    // Timeouts (em segundos)
    // ========================================
    
    /**
     * Timeout padrao para espera de elementos
     */
    public static final int DEFAULT_TIMEOUT = 10;
    
    /**
     * Timeout para carregamento de pagina
     */
    public static final int PAGE_LOAD_TIMEOUT = 30;
    
    /**
     * Timeout implicito do WebDriver
     */
    public static final int IMPLICIT_WAIT = 5;

    // ========================================
    // Configuracoes do Browser
    // ========================================
    
    /**
     * Verifica se deve executar em modo headless
     * Ativado via variavel de ambiente HEADLESS=true
     */
    public static final boolean HEADLESS = Boolean.parseBoolean(getEnvOrDefault("HEADLESS", "false"));
    
    /**
     * Largura da janela do navegador
     */
    public static final int BROWSER_WIDTH = 1920;
    
    /**
     * Altura da janela do navegador
     */
    public static final int BROWSER_HEIGHT = 1080;

    // ========================================
    // Metodos Utilitarios
    // ========================================
    
    /**
     * Obtem valor de variavel de ambiente ou retorna valor padrao
     * @param envName Nome da variavel de ambiente
     * @param defaultValue Valor padrao caso a variavel nao exista
     * @return Valor da variavel ou valor padrao
     */
    private static String getEnvOrDefault(String envName, String defaultValue) {
        String value = System.getenv(envName);
        return (value != null && !value.isEmpty()) ? value : defaultValue;
    }
    
    /**
     * Imprime as configuracoes atuais (util para debug)
     */
    public static void printConfig() {
        System.out.println("========================================");
        System.out.println("QA Track - Configuracoes de Teste");
        System.out.println("========================================");
        System.out.println("API_BASE_URL: " + API_BASE_URL);
        System.out.println("WEB_BASE_URL: " + WEB_BASE_URL);
        System.out.println("HEADLESS: " + HEADLESS);
        System.out.println("DEFAULT_TIMEOUT: " + DEFAULT_TIMEOUT + "s");
        System.out.println("========================================");
    }
}

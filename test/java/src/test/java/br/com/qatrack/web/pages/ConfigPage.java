package br.com.qatrack.web.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;

import java.util.List;

/**
 * Page Object da pagina de Configuracoes
 * QA Track - v1.0.0
 */
public class ConfigPage extends BasePage {

    // ========================================
    // Localizadores
    // ========================================
    
    // Abas
    private static final By TAB_SISTEMAS = By.xpath("//button[contains(@class, 'tab') and contains(text(), 'Sistemas')]");
    private static final By TAB_STATUS = By.xpath("//button[contains(@class, 'tab') and contains(text(), 'Status')]");
    
    // Formulario de adicao
    private static final By INPUT_NOVO_ITEM = By.cssSelector(".inline-add input.form-input");
    private static final By BTN_ADICIONAR = By.xpath("//button[contains(@class, 'btn-primary') and contains(text(), 'Adicionar')]");
    
    // Lista de itens
    private static final By LISTA_ITENS = By.cssSelector(".list-item");
    private static final By TEXTO_ITEM = By.cssSelector(".list-item-text");

    // ========================================
    // Acoes
    // ========================================
    
    /**
     * Navega para a pagina de configuracoes
     */
    public void abrirPaginaConfiguracoes() {
        navigateTo("/config");
        waitForPageLoad();
        sleep(500); // Aguarda carregamento inicial
    }

    /**
     * Clica na aba Sistemas
     */
    public void clicarAbaSistemas() {
        click(TAB_SISTEMAS);
        sleep(300);
    }

    /**
     * Clica na aba Status
     */
    public void clicarAbaStatus() {
        click(TAB_STATUS);
        sleep(300);
    }

    /**
     * Preenche o campo de novo sistema/item
     * @param texto Texto a ser preenchido
     */
    public void preencherCampoNovoItem(String texto) {
        type(INPUT_NOVO_ITEM, texto);
    }

    /**
     * Clica no botao Adicionar
     */
    public void clicarBotaoAdicionar() {
        click(BTN_ADICIONAR);
        sleep(1000); // Aguarda a requisicao e atualizacao da lista
    }

    /**
     * Cria um novo sistema
     * @param nomeSistema Nome do sistema a ser criado
     */
    public void criarSistema(String nomeSistema) {
        clicarAbaSistemas();
        preencherCampoNovoItem(nomeSistema);
        clicarBotaoAdicionar();
    }

    // ========================================
    // Validacoes
    // ========================================
    
    /**
     * Verifica se um item esta presente na lista
     * @param texto Texto do item a ser procurado
     * @return true se encontrado
     */
    public boolean itemExisteNaLista(String texto) {
        List<WebElement> itens = findElements(LISTA_ITENS);
        for (WebElement item : itens) {
            String textoItem = item.getText();
            if (textoItem.contains(texto)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Aguarda ate que um item apareca na lista
     * @param texto Texto do item esperado
     * @return true se encontrado dentro do timeout
     */
    public boolean aguardarItemNaLista(String texto) {
        int tentativas = 10;
        while (tentativas > 0) {
            if (itemExisteNaLista(texto)) {
                return true;
            }
            sleep(500);
            tentativas--;
        }
        return false;
    }

    /**
     * Obtem a quantidade de itens na lista
     * @return Numero de itens
     */
    public int contarItensNaLista() {
        return findElements(LISTA_ITENS).size();
    }

    /**
     * Verifica se a pagina de configuracoes foi carregada
     * @return true se carregada
     */
    public boolean paginaCarregada() {
        return isElementVisible(TAB_SISTEMAS) && isElementVisible(TAB_STATUS);
    }
}

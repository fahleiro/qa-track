package br.com.qatrack.web.interactions;

import br.com.qatrack.web.pages.ConfigPage;

import static org.junit.Assert.*;

/**
 * Interacoes WEB com a funcionalidade de Sistemas
 * Contem toda a logica de interacao com a interface
 * QA Track - v1.0.0
 */
public class SystemWEBInteractions {

    private ConfigPage configPage;

    /**
     * Inicializa as paginas necessarias
     */
    public void inicializarPaginas() {
        configPage = new ConfigPage();
    }

    /**
     * Abre a pagina de configuracoes
     */
    public void abrirPaginaConfiguracoes() {
        configPage.abrirPaginaConfiguracoes();
        System.out.println("[WEB] Pagina de configuracoes aberta");
    }

    /**
     * Valida que a pagina de configuracoes foi carregada
     */
    public void validarPaginaCarregada() {
        assertTrue(
            "A pagina de configuracoes deve estar carregada",
            configPage.paginaCarregada()
        );
        System.out.println("[WEB] Pagina de configuracoes carregada com sucesso");
    }

    /**
     * Clica na aba Sistemas
     */
    public void clicarAbaSistemas() {
        configPage.clicarAbaSistemas();
        System.out.println("[WEB] Aba 'Sistemas' selecionada");
    }

    /**
     * Clica na aba Status
     */
    public void clicarAbaStatus() {
        configPage.clicarAbaStatus();
        System.out.println("[WEB] Aba 'Status' selecionada");
    }

    /**
     * Clica em uma aba pelo nome
     * @param nomeAba Nome da aba
     */
    public void clicarAba(String nomeAba) {
        switch (nomeAba.toLowerCase()) {
            case "sistemas":
                clicarAbaSistemas();
                break;
            case "status":
                clicarAbaStatus();
                break;
            default:
                fail("Aba desconhecida: " + nomeAba);
        }
    }

    /**
     * Preenche o campo de novo item
     * @param texto Texto a preencher
     */
    public void preencherCampoNovoItem(String texto) {
        configPage.preencherCampoNovoItem(texto);
        System.out.println("[WEB] Campo preenchido com: " + texto);
    }

    /**
     * Clica no botao Adicionar
     */
    public void clicarBotaoAdicionar() {
        configPage.clicarBotaoAdicionar();
        System.out.println("[WEB] Botao 'Adicionar' clicado");
    }

    /**
     * Clica em um botao pelo nome
     * @param nomeBotao Nome do botao
     */
    public void clicarBotao(String nomeBotao) {
        if (nomeBotao.equalsIgnoreCase("Adicionar")) {
            clicarBotaoAdicionar();
        } else {
            fail("Botao desconhecido: " + nomeBotao);
        }
    }

    /**
     * Cria um novo sistema
     * @param nomeSistema Nome do sistema
     */
    public void criarSistema(String nomeSistema) {
        configPage.criarSistema(nomeSistema);
        System.out.println("[WEB] Sistema '" + nomeSistema + "' criado");
    }

    /**
     * Valida que um sistema existe na lista
     * @param nomeSistema Nome do sistema
     */
    public void validarSistemaNaLista(String nomeSistema) {
        boolean encontrado = configPage.aguardarItemNaLista(nomeSistema);
        assertTrue(
            "O sistema '" + nomeSistema + "' deve aparecer na lista",
            encontrado
        );
        System.out.println("[WEB] Sistema '" + nomeSistema + "' encontrado na lista");
    }

    /**
     * Valida que um item existe na lista
     * @param nomeItem Nome do item
     */
    public void validarItemNaLista(String nomeItem) {
        boolean encontrado = configPage.itemExisteNaLista(nomeItem);
        assertTrue(
            "O item '" + nomeItem + "' deve existir na lista",
            encontrado
        );
        System.out.println("[WEB] Item '" + nomeItem + "' verificado na lista");
    }

    /**
     * Valida quantidade minima de itens na lista
     * @param quantidadeMinima Quantidade minima esperada
     */
    public void validarQuantidadeMinimaItens(int quantidadeMinima) {
        int quantidade = configPage.contarItensNaLista();
        assertTrue(
            "A lista deve conter pelo menos " + quantidadeMinima + " item(s), mas contem " + quantidade,
            quantidade >= quantidadeMinima
        );
        System.out.println("[WEB] Lista contem " + quantidade + " item(s)");
    }

    /**
     * Obtem a pagina de configuracoes
     * @return ConfigPage
     */
    public ConfigPage getConfigPage() {
        return configPage;
    }
}

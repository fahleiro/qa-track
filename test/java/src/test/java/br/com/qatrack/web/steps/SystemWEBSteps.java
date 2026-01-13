package br.com.qatrack.web.steps;

import br.com.qatrack.web.interactions.SystemWEBInteractions;
import io.cucumber.java.pt.Dado;
import io.cucumber.java.pt.Entao;
import io.cucumber.java.pt.Quando;
import io.cucumber.java.pt.E;

/**
 * Step Definitions para testes WEB - Sistema
 * Apenas mapeia steps para chamadas de Interactions
 * QA Track - v1.0.0
 */
public class SystemWEBSteps {

    private final SystemWEBInteractions webInteractions = new SystemWEBInteractions();

    @Dado("que estou na pagina de configuracoes")
    public void queEstouNaPaginaDeConfiguracoes() {
        webInteractions.inicializarPaginas();
        webInteractions.abrirPaginaConfiguracoes();
        webInteractions.validarPaginaCarregada();
    }

    @Quando("eu clico na aba {string}")
    public void euClicoNaAba(String nomeAba) {
        webInteractions.clicarAba(nomeAba);
    }

    @E("preencho o campo de sistema com {string}")
    public void preenchoOCampoDeSistemaCom(String nomeSistema) {
        webInteractions.preencherCampoNovoItem(nomeSistema);
    }

    @E("clico no botao {string}")
    public void clicoNoBotao(String nomeBotao) {
        webInteractions.clicarBotao(nomeBotao);
    }

    @Entao("o sistema {string} deve aparecer na lista")
    public void oSistemaDeveAparecerNaLista(String nomeSistema) {
        webInteractions.validarSistemaNaLista(nomeSistema);
    }

    @Entao("o item {string} deve existir na lista")
    public void oItemDeveExistirNaLista(String nomeItem) {
        webInteractions.validarItemNaLista(nomeItem);
    }

    @Entao("a lista deve conter pelo menos {int} item(s)")
    public void aListaDeveConterPeloMenosItens(int quantidadeMinima) {
        webInteractions.validarQuantidadeMinimaItens(quantidadeMinima);
    }

    @Quando("eu crio um novo sistema com nome {string}")
    public void euCrioUmNovoSistemaComNome(String nomeSistema) {
        webInteractions.criarSistema(nomeSistema);
    }
}

package br.com.qatrack.api.steps;

import br.com.qatrack.api.interactions.SystemAPIInteractions;
import io.cucumber.java.pt.Dado;
import io.cucumber.java.pt.Entao;
import io.cucumber.java.pt.Quando;
import io.cucumber.java.pt.E;

/**
 * Step Definitions para testes de API - Sistema
 * Apenas mapeia steps para chamadas de Interactions
 * QA Track - v1.0.0
 */
public class SystemAPISteps {

    private final SystemAPIInteractions apiInteractions = new SystemAPIInteractions();

    @Dado("que a API esta disponivel")
    public void queAAPIEstaDisponivel() {
        apiInteractions.configurarAPI();
    }

    @Quando("eu faco uma requisicao GET para {string}")
    public void euFacoUmaRequisicaoGETPara(String endpoint) {
        apiInteractions.executarGET(endpoint);
    }

    @Quando("eu faco uma requisicao POST para {string} com body:")
    public void euFacoUmaRequisicaoPOSTParaComBody(String endpoint, String body) {
        apiInteractions.executarPOST(endpoint, body);
    }

    @Entao("o status code deve ser {int}")
    public void oStatusCodeDeveSer(int expectedStatusCode) {
        apiInteractions.validarStatusCode(expectedStatusCode);
    }

    @E("a resposta deve ser uma lista JSON")
    public void aRespostaDeveSerUmaListaJSON() {
        apiInteractions.validarRespostaListaJSON();
    }

    @E("a resposta deve ser um objeto JSON")
    public void aRespostaDeveSerUmObjetoJSON() {
        apiInteractions.validarRespostaObjetoJSON();
    }

    @E("a resposta deve conter o campo {string}")
    public void aRespostaDeveConterOCampo(String campo) {
        apiInteractions.validarCampoExiste(campo);
    }

    @E("o campo {string} deve ter o valor {string}")
    public void oCampoDeveTerOValor(String campo, String valorEsperado) {
        apiInteractions.validarValorCampo(campo, valorEsperado);
    }

    @E("a lista nao deve estar vazia")
    public void aListaNaoDeveEstarVazia() {
        apiInteractions.validarListaNaoVazia();
    }

    @E("imprimo a resposta")
    public void imprimoAResposta() {
        apiInteractions.imprimirResposta();
    }
}

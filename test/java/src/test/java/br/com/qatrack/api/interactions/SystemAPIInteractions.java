package br.com.qatrack.api.interactions;

import br.com.qatrack.shared.config.TestConfig;
import io.restassured.RestAssured;
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;

import static io.restassured.RestAssured.given;
import static org.junit.Assert.*;

/**
 * Interacoes com a API de Sistemas
 * Contem toda a logica de comunicacao com a API
 * QA Track - v1.0.0
 */
public class SystemAPIInteractions {

    private Response response;
    private RequestSpecification request;

    /**
     * Configura a conexao com a API
     */
    public void configurarAPI() {
        RestAssured.baseURI = TestConfig.API_BASE_URL;
        request = given()
            .contentType("application/json")
            .accept("application/json");
        
        System.out.println("[API] Base URI configurada: " + TestConfig.API_BASE_URL);
    }

    /**
     * Executa requisicao GET
     * @param endpoint Endpoint da API
     */
    public void executarGET(String endpoint) {
        System.out.println("[API] Executando GET: " + endpoint);
        response = request.get(endpoint);
        System.out.println("[API] Status Code: " + response.getStatusCode());
    }

    /**
     * Executa requisicao POST com body
     * @param endpoint Endpoint da API
     * @param body Corpo da requisicao em JSON
     */
    public void executarPOST(String endpoint, String body) {
        System.out.println("[API] Executando POST: " + endpoint);
        System.out.println("[API] Body: " + body);
        response = request.body(body).post(endpoint);
        System.out.println("[API] Status Code: " + response.getStatusCode());
    }

    /**
     * Executa requisicao DELETE
     * @param endpoint Endpoint da API
     */
    public void executarDELETE(String endpoint) {
        System.out.println("[API] Executando DELETE: " + endpoint);
        response = request.delete(endpoint);
        System.out.println("[API] Status Code: " + response.getStatusCode());
    }

    /**
     * Valida o status code da resposta
     * @param expectedStatusCode Status esperado
     */
    public void validarStatusCode(int expectedStatusCode) {
        int actualStatusCode = response.getStatusCode();
        assertEquals(
            "Status code esperado: " + expectedStatusCode + ", recebido: " + actualStatusCode,
            expectedStatusCode, 
            actualStatusCode
        );
        System.out.println("[API] Status code validado: " + actualStatusCode);
    }

    /**
     * Valida que a resposta e uma lista JSON
     */
    public void validarRespostaListaJSON() {
        String responseBody = response.getBody().asString();
        assertTrue(
            "A resposta deve comecar com '[' (array JSON)",
            responseBody.trim().startsWith("[")
        );
        System.out.println("[API] Resposta e uma lista JSON valida");
    }

    /**
     * Valida que a resposta e um objeto JSON
     */
    public void validarRespostaObjetoJSON() {
        String responseBody = response.getBody().asString();
        assertTrue(
            "A resposta deve comecar com '{' (objeto JSON)",
            responseBody.trim().startsWith("{")
        );
        System.out.println("[API] Resposta e um objeto JSON valido");
    }

    /**
     * Valida que um campo existe na resposta
     * @param campo Nome do campo
     */
    public void validarCampoExiste(String campo) {
        Object valor = response.jsonPath().get(campo);
        assertNotNull("O campo '" + campo + "' deve existir na resposta", valor);
        System.out.println("[API] Campo '" + campo + "' encontrado: " + valor);
    }

    /**
     * Valida o valor de um campo
     * @param campo Nome do campo
     * @param valorEsperado Valor esperado
     */
    public void validarValorCampo(String campo, String valorEsperado) {
        String valorAtual = response.jsonPath().getString(campo);
        assertEquals(
            "Valor esperado para '" + campo + "': " + valorEsperado,
            valorEsperado,
            valorAtual
        );
        System.out.println("[API] Campo '" + campo + "' = '" + valorAtual + "'");
    }

    /**
     * Valida que a lista nao esta vazia
     */
    public void validarListaNaoVazia() {
        int size = response.jsonPath().getList("$").size();
        assertTrue("A lista deve conter pelo menos 1 elemento", size > 0);
        System.out.println("[API] Lista contem " + size + " elemento(s)");
    }

    /**
     * Imprime o corpo da resposta
     */
    public void imprimirResposta() {
        System.out.println("[API] Response Body:");
        System.out.println(response.getBody().prettyPrint());
    }

    /**
     * Obtem a resposta atual
     * @return Response
     */
    public Response getResponse() {
        return response;
    }
}

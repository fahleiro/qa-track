# language: pt
# ========================================
# QA Track - Testes de API
# Funcionalidade: Sistema
# ========================================

@API
Funcionalidade: [API] Gerenciamento de Sistemas via API
  Como um usuario da API do QA Track
  Eu quero poder gerenciar sistemas via requisicoes HTTP
  Para que eu possa integrar com outras ferramentas

  Contexto:
    Dado que a API esta disponivel

  @API @smoke
  Cenario: Listar todos os sistemas cadastrados
    Quando eu faco uma requisicao GET para "/api/system"
    Entao o status code deve ser 200
    E a resposta deve ser uma lista JSON

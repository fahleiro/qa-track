# language: pt
# ========================================
# QA Track - Testes WEB
# Funcionalidade: Sistema
# ========================================

@WEB
Funcionalidade: [WEB] Gerenciamento de Sistemas via Interface
  Como um usuario do QA Track
  Eu quero poder gerenciar sistemas pela interface web
  Para que eu possa organizar meus cenarios de teste

  @WEB @smoke
  Cenario: Criar um novo sistema via interface web
    Dado que estou na pagina de configuracoes
    Quando eu clico na aba "Sistemas"
    E preencho o campo de sistema com "Sistema Teste Automatizado"
    E clico no botao "Adicionar"
    Entao o sistema "Sistema Teste Automatizado" deve aparecer na lista

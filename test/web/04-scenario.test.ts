import { createDriver, navigateTo, fillInput, clickElement, waitForText, closeDriver, elementExists, By, log } from './config/web-driver'
import { findScenarioByTitle } from './config/db-helper'
import { WebDriver } from 'selenium-webdriver'

const TEST_NAME = `TEST_SCN_WEB_${Date.now()}`
let driver: WebDriver | null = null

async function testCreateScenario(): Promise<void> {
  log.section('WEB — Criar cenário')

  driver = await createDriver()
  await navigateTo(driver, '/scenarios')

  // Abrir modal de criação
  await clickElement(driver, By.xpath('//button[contains(text(), "+ Novo") or contains(text(), "New")]'))
  log.info('Modal de novo cenário aberto')

  // Preencher título
  await fillInput(driver, By.css('input[placeholder*="título" i], input[placeholder*="title" i]'), TEST_NAME)

  // Adicionar pré-requisito
  const preInput = await driver!.findElement(By.css('input[placeholder*="Pré-requisito" i]'))
  await preInput.clear()
  await preInput.sendKeys('Pre-requisito de teste')

  // Adicionar resultado esperado
  const expectInput = await driver!.findElement(By.css('input[placeholder*="Resultado" i]'))
  await expectInput.clear()
  await expectInput.sendKeys('Resultado esperado de teste')

  // Clicar em Criar
  await clickElement(driver, By.xpath('//button[contains(text(), "Criar") or contains(text(), "Create")]'))
  log.info('Cenário submetido')

  await waitForText(driver, TEST_NAME)
  log.success(`Cenário "${TEST_NAME}" visível na lista`)
}

async function validateInDb(): Promise<void> {
  log.section('DB — Validar cenário')
  const result = await findScenarioByTitle(TEST_NAME)
  result.exists
    ? log.success(`Cenário encontrado no DB (ID ${result.data?.id})`)
    : log.error(`Cenário "${TEST_NAME}" NÃO encontrado no DB`)
}

async function testEditScenario(): Promise<void> {
  log.section('WEB — Editar cenário')

  // Clicar no card para abrir menu
  const card = await driver!.findElement(By.xpath(`//*[contains(text(), "${TEST_NAME}")]`))
  await card.click()

  const editBtn = await driver!.findElement(By.xpath('//button[contains(text(), "Editar") or contains(text(), "Edit")]'))
  await editBtn.click()
  log.info('Modal de edição aberto')

  const titleInput = await driver!.findElement(By.css('input[placeholder*="título" i], input[placeholder*="title" i]'))
  await titleInput.clear()
  await titleInput.sendKeys(` EDITADO`)

  await clickElement(driver!, By.xpath('//button[contains(text(), "Salvar") or contains(text(), "Save")]'))
  log.success('Cenário editado sem erros')
}

async function cleanup(): Promise<void> {
  log.section('CLEANUP')
  try {
    // Remover cenário via UI (botão ×)
    const deleteBtn = await driver!.findElement(By.css('.btn-ghost.btn-icon'))
    await deleteBtn.click()
    // Confirmar modal
    if (await elementExists(driver!, By.xpath('//button[contains(text(), "Confirmar")]'))) {
      await clickElement(driver!, By.xpath('//button[contains(text(), "Confirmar")]'))
    }
    log.info('Cenário removido via UI')
  } catch {
    log.warn('Não foi possível remover via UI')
  } finally {
    await closeDriver(driver!)
    driver = null
  }
}

export async function run(): Promise<void> {
  console.log('\n╔══════════════════════════════════╗')
  console.log('║   WEB TESTS: Cenário             ║')
  console.log('╚══════════════════════════════════╝')
  try {
    await testCreateScenario()
    await validateInDb()
    await testEditScenario()
  } finally {
    await cleanup()
  }
}

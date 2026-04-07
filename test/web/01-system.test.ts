import { createDriver, navigateTo, fillInput, clickElement, waitForText, closeDriver, By, log } from './config/web-driver'
import { findSystemByTitle, deleteSystemByTitle } from './config/db-helper'
import { WebDriver } from 'selenium-webdriver'

const TEST_NAME = `TEST_SYSTEM_WEB_${Date.now()}`
let driver: WebDriver | null = null

async function testCreateSystem(): Promise<void> {
  log.section('WEB — Criar sistema')

  driver = await createDriver()
  await navigateTo(driver, '/config')

  // Clicar na aba Sistemas
  await clickElement(driver, By.xpath('//button[contains(text(), "Sistemas") or contains(text(), "Systems")]'))
  log.info('Aba Sistemas selecionada')

  // Preencher campo e clicar em Adicionar
  await fillInput(driver, By.css('input[placeholder*="sistema" i], input[placeholder*="system" i]'), TEST_NAME)
  await clickElement(driver, By.xpath('//button[contains(text(), "Adicionar") or contains(text(), "Add")]'))
  log.info(`Sistema "${TEST_NAME}" enviado`)

  // Aguardar aparecer na lista
  await waitForText(driver, TEST_NAME)
  log.success(`Sistema "${TEST_NAME}" visível na UI`)
}

async function validateInDb(): Promise<void> {
  log.section('DB — Validar sistema')
  const result = await findSystemByTitle(TEST_NAME)
  result.exists
    ? log.success(`Sistema "${TEST_NAME}" encontrado no DB (ID ${result.data?.id})`)
    : log.error(`Sistema "${TEST_NAME}" NÃO encontrado no DB`)
}

async function cleanup(): Promise<void> {
  log.section('CLEANUP')
  await closeDriver(driver!)
  driver = null
  const deleted = await deleteSystemByTitle(TEST_NAME)
  deleted
    ? log.success(`Sistema "${TEST_NAME}" removido do DB`)
    : log.warn(`Sistema "${TEST_NAME}" não encontrado para remoção`)
}

export async function run(): Promise<void> {
  console.log('\n╔══════════════════════════════════╗')
  console.log('║   WEB TESTS: Sistema             ║')
  console.log('╚══════════════════════════════════╝')
  try {
    await testCreateSystem()
    await validateInDb()
  } finally {
    await cleanup()
  }
}

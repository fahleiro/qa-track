import { createDriver, navigateTo, fillInput, clickElement, waitForText, closeDriver, By, log } from './config/web-driver'
import { findStatusByTitle, deleteStatusByTitle } from './config/db-helper'
import { WebDriver } from 'selenium-webdriver'

const TEST_NAME = `TEST_STATUS_WEB_${Date.now()}`
let driver: WebDriver | null = null

async function testCreateStatus(): Promise<void> {
  log.section('WEB — Criar status')

  driver = await createDriver()
  await navigateTo(driver, '/config')

  await clickElement(driver, By.xpath('//button[contains(text(), "Status")]'))
  log.info('Aba Status selecionada')

  await fillInput(driver, By.css('input[placeholder*="status" i]'), TEST_NAME)
  await clickElement(driver, By.xpath('//button[contains(text(), "Adicionar") or contains(text(), "Add")]'))
  log.info(`Status "${TEST_NAME}" enviado`)

  await waitForText(driver, TEST_NAME)
  log.success(`Status "${TEST_NAME}" visível na UI`)
}

async function validateInDb(): Promise<void> {
  log.section('DB — Validar status')
  const result = await findStatusByTitle(TEST_NAME)
  result.exists
    ? log.success(`Status encontrado no DB (ID ${result.data?.id})`)
    : log.error(`Status "${TEST_NAME}" NÃO encontrado no DB`)
}

async function cleanup(): Promise<void> {
  log.section('CLEANUP')
  await closeDriver(driver!)
  driver = null
  await deleteStatusByTitle(TEST_NAME)
  log.info(`Status "${TEST_NAME}" removido`)
}

export async function run(): Promise<void> {
  console.log('\n╔══════════════════════════════════╗')
  console.log('║   WEB TESTS: Status              ║')
  console.log('╚══════════════════════════════════╝')
  try {
    await testCreateStatus()
    await validateInDb()
  } finally {
    await cleanup()
  }
}

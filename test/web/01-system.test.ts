import { createDriver, navigateTo, fillInput, clickElement, waitForText, waitForTextGone, closeDriver, By, log, takeScreenshot } from './config/web-driver'
import { findSystemByTitle, deleteSystemByTitle } from './config/db-helper'
import { evidence } from '../shared/evidence'
import { WebDriver } from 'selenium-webdriver'

const SUITE = '01-system'
const TEST_NAME = `TEST_SYSTEM_WEB_${Date.now()}`
const TEST_NAME_EDITED = `${TEST_NAME}_EDIT`
let driver: WebDriver | null = null

async function step(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn()
    const sc = driver ? await takeScreenshot(driver, SUITE, name) : null
    evidence.addWeb({ suite: SUITE, step: name, screenshotPath: sc, passed: true })
    log.success(name)
  } catch (err) {
    const sc = driver ? await takeScreenshot(driver, SUITE, `FAIL_${name}`) : null
    evidence.addWeb({ suite: SUITE, step: name, screenshotPath: sc, passed: false })
    log.error(`FALHOU: ${name} — ${(err as Error).message}`)
    throw err
  }
}

async function testCreateSystem(): Promise<void> {
  log.section('WEB — Criar sistema')
  await step('01_navegar_para_config', async () => {
    driver = await createDriver()
    await navigateTo(driver, '/config')
  })

  await step('02_clicar_aba_sistemas', async () => {
    await clickElement(driver!, By.xpath('//button[contains(text(),"Sistemas")]'))
  })

  await step('03_preencher_e_adicionar', async () => {
    await fillInput(driver!, By.css('input[placeholder="Nome do sistema"]'), TEST_NAME)
    await clickElement(driver!, By.xpath('//button[contains(text(),"Adicionar")]'))
    await waitForText(driver!, TEST_NAME)
  })
}

async function testValidateDb(): Promise<void> {
  log.section('DB — Validar criação')
  await step('04_validar_no_db', async () => {
    const result = await findSystemByTitle(TEST_NAME)
    if (!result.exists) throw new Error(`Sistema "${TEST_NAME}" não encontrado no DB`)
    log.info(`ID no DB: ${result.data?.id}`)
  })
}

async function testEditSystem(): Promise<void> {
  log.section('WEB — Editar sistema')
  await step('05_abrir_menu_item', async () => {
    await clickElement(driver!, By.xpath(`//div[contains(@class,'list-item') and contains(.,'${TEST_NAME}')]`))
    await driver!.sleep(500)
  })

  await step('06_clicar_editar', async () => {
    await clickElement(driver!, By.xpath('//button[contains(@class,"action-menu-item") and contains(text(),"Editar")]'))
    await driver!.sleep(500)
  })

  await step('07_alterar_titulo_e_salvar', async () => {
    const input = await driver!.findElement(By.css('.modal input.form-input'))
    await input.clear()
    await input.sendKeys(TEST_NAME_EDITED)
    await clickElement(driver!, By.xpath('//div[contains(@class,"modal-footer")]//button[contains(text(),"Salvar")]'))
    await waitForText(driver!, TEST_NAME_EDITED)
  })
}

async function testDeleteSystem(): Promise<void> {
  log.section('WEB — Remover sistema')
  await step('08_clicar_excluir', async () => {
    const row = await driver!.findElement(By.xpath(`//div[contains(@class,'list-item') and contains(.,'${TEST_NAME_EDITED}')]`))
    const btn = await row.findElement(By.css('.btn-ghost.btn-icon'))
    await btn.click()
    await driver!.sleep(300)
  })

  await step('09_confirmar_exclusao', async () => {
    await clickElement(driver!, By.xpath('//button[contains(text(),"Confirmar")]'))
    await waitForTextGone(driver!, TEST_NAME_EDITED)
  })
}

async function cleanup(): Promise<void> {
  log.section('CLEANUP')
  if (driver) {
    await closeDriver(driver)
    driver = null
  }
  await deleteSystemByTitle(TEST_NAME_EDITED).catch(() => deleteSystemByTitle(TEST_NAME))
  log.info('Cleanup concluído')
}

export async function run(): Promise<void> {
  console.log('\n╔══════════════════════════════════╗')
  console.log('║   WEB TESTS: Sistema             ║')
  console.log('╚══════════════════════════════════╝')
  try {
    await testCreateSystem()
    await testValidateDb()
    await testEditSystem()
    await testDeleteSystem()
  } finally {
    await cleanup()
  }
}

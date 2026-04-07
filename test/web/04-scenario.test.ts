import { createDriver, navigateTo, fillInput, clickElement, waitForText, waitForTextGone, closeDriver, By, log, takeScreenshot } from './config/web-driver'
import { findScenarioByTitle } from './config/db-helper'
import { evidence } from '../shared/evidence'
import { WebDriver } from 'selenium-webdriver'

const SUITE = '04-scenario'
const TEST_NAME = `TEST_SCN_WEB_${Date.now()}`
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

async function testCreateScenario(): Promise<void> {
  log.section('WEB — Criar cenário')
  await step('01_navegar_para_cenarios', async () => {
    driver = await createDriver()
    await navigateTo(driver, '/scenarios')
  })

  await step('02_abrir_modal_novo', async () => {
    await clickElement(driver!, By.xpath('//button[contains(text(),"+ Novo")]'))
    await driver!.sleep(500)
  })

  await step('03_preencher_titulo', async () => {
    await fillInput(driver!, By.css('input[placeholder="Título do cenário"]'), TEST_NAME)
  })

  await step('04_preencher_prerequisito', async () => {
    const preInput = await driver!.findElement(By.css('input[placeholder="Pré-requisito 1"]'))
    await preInput.clear()
    await preInput.sendKeys('Pré-requisito de teste')
  })

  await step('05_preencher_resultado_esperado', async () => {
    const expInput = await driver!.findElement(By.css('input[placeholder="Resultado 1"]'))
    await expInput.clear()
    await expInput.sendKeys('Resultado esperado de teste')
  })

  await step('06_criar_cenario', async () => {
    await clickElement(driver!, By.xpath('//div[contains(@class,"modal-footer")]//button[contains(text(),"Criar")]'))
    await waitForText(driver!, TEST_NAME)
  })
}

async function testValidateDb(): Promise<void> {
  log.section('DB — Validar criação')
  await step('07_validar_no_db', async () => {
    const result = await findScenarioByTitle(TEST_NAME)
    if (!result.exists) throw new Error(`Cenário "${TEST_NAME}" não encontrado no DB`)
    log.info(`ID no DB: ${result.data?.id}`)
  })
}

async function testEditScenario(): Promise<void> {
  log.section('WEB — Editar cenário')
  await step('08_abrir_menu_item', async () => {
    await clickElement(driver!, By.xpath(`//div[contains(@class,'list-item') and contains(.,'${TEST_NAME}')]`))
    await driver!.sleep(500)
  })

  await step('09_clicar_editar', async () => {
    await clickElement(driver!, By.xpath('//button[contains(@class,"action-menu-item") and contains(text(),"Editar")]'))
    await driver!.sleep(500)
  })

  await step('10_alterar_titulo_e_salvar', async () => {
    const input = await driver!.findElement(By.css('input[placeholder="Título do cenário"]'))
    await input.clear()
    await input.sendKeys(TEST_NAME_EDITED)
    await clickElement(driver!, By.xpath('//div[contains(@class,"modal-footer")]//button[contains(text(),"Salvar")]'))
    await waitForText(driver!, TEST_NAME_EDITED)
  })
}

async function testDeleteScenario(): Promise<void> {
  log.section('WEB — Remover cenário')
  await step('11_clicar_excluir', async () => {
    const row = await driver!.findElement(By.xpath(`//div[contains(@class,'list-item') and contains(.,'${TEST_NAME_EDITED}')]`))
    const btn = await row.findElement(By.css('.btn-ghost.btn-icon'))
    await btn.click()
    await driver!.sleep(300)
  })

  await step('12_confirmar_exclusao', async () => {
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
  log.info('Cleanup concluído')
}

export async function run(): Promise<void> {
  console.log('\n╔══════════════════════════════════╗')
  console.log('║   WEB TESTS: Cenário             ║')
  console.log('╚══════════════════════════════════╝')
  try {
    await testCreateScenario()
    await testValidateDb()
    await testEditScenario()
    await testDeleteScenario()
  } finally {
    await cleanup()
  }
}

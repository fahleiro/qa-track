import { createDriver, navigateTo, fillInput, clickElement, waitForText, waitForTextGone, closeDriver, selectOptionByText, By, log, takeScreenshot } from './config/web-driver'
import { findFeatureByTitle, deleteFeatureByTitle, deleteSystemByTitle } from './config/db-helper'
import { request } from '../shared/api-client'
import { evidence } from '../shared/evidence'
import { System } from '../shared/types'
import { WebDriver } from 'selenium-webdriver'

const SUITE = '02-feature'
const TEST_FEATURE_NAME = `TEST_FEATURE_WEB_${Date.now()}`
const TEST_FEATURE_EDITED = `${TEST_FEATURE_NAME}_EDIT`
const TEST_SYSTEM_NAME = `TEST_SYS_FOR_FEAT_WEB_${Date.now()}`
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

async function setup(): Promise<void> {
  log.section('SETUP — criar sistema via API')
  const res = await request<System>('POST', '/api/system', { title: TEST_SYSTEM_NAME })
  res.status === 201
    ? log.success(`Sistema "${TEST_SYSTEM_NAME}" criado (ID ${res.data?.id})`)
    : log.warn(`Sistema criado com status ${res.status}`)
}

async function testCreateFeature(): Promise<void> {
  log.section('WEB — Criar feature')
  await step('01_navegar_para_config', async () => {
    driver = await createDriver()
    await navigateTo(driver, '/config')
  })

  await step('02_clicar_aba_features', async () => {
    await clickElement(driver!, By.xpath('//button[contains(text(),"Features")]'))
  })

  await step('03_preencher_e_adicionar', async () => {
    await fillInput(driver!, By.css('input[placeholder="Nome da feature"]'), TEST_FEATURE_NAME)
    await selectOptionByText(driver!, By.css('select'), TEST_SYSTEM_NAME)
    await clickElement(driver!, By.xpath('//button[contains(text(),"Adicionar")]'))
    await waitForText(driver!, TEST_FEATURE_NAME)
  })
}

async function testValidateDb(): Promise<void> {
  log.section('DB — Validar criação')
  await step('04_validar_no_db', async () => {
    const result = await findFeatureByTitle(TEST_FEATURE_NAME)
    if (!result.exists) throw new Error(`Feature "${TEST_FEATURE_NAME}" não encontrada no DB`)
    log.info(`ID no DB: ${result.data?.id}`)
  })
}

async function testEditFeature(): Promise<void> {
  log.section('WEB — Editar feature')
  await step('05_abrir_menu_item', async () => {
    await clickElement(driver!, By.xpath(`//div[contains(@class,'list-item') and contains(.,'${TEST_FEATURE_NAME}')]`))
    await driver!.sleep(500)
  })

  await step('06_clicar_editar', async () => {
    await clickElement(driver!, By.xpath('//button[contains(@class,"action-menu-item") and contains(text(),"Editar")]'))
    await driver!.sleep(500)
  })

  await step('07_alterar_titulo_e_salvar', async () => {
    const input = await driver!.findElement(By.css('.modal input.form-input'))
    await input.clear()
    await input.sendKeys(TEST_FEATURE_EDITED)
    await clickElement(driver!, By.xpath('//div[contains(@class,"modal-footer")]//button[contains(text(),"Salvar")]'))
    await waitForText(driver!, TEST_FEATURE_EDITED)
  })
}

async function testDeleteFeature(): Promise<void> {
  log.section('WEB — Remover feature')
  await step('08_clicar_excluir', async () => {
    const row = await driver!.findElement(By.xpath(`//div[contains(@class,'list-item') and contains(.,'${TEST_FEATURE_EDITED}')]`))
    const btn = await row.findElement(By.css('.btn-ghost.btn-icon'))
    await btn.click()
    await driver!.sleep(300)
  })

  await step('09_confirmar_exclusao', async () => {
    await clickElement(driver!, By.xpath('//button[contains(text(),"Confirmar")]'))
    await waitForTextGone(driver!, TEST_FEATURE_EDITED)
  })
}

async function cleanup(): Promise<void> {
  log.section('CLEANUP')
  if (driver) {
    await closeDriver(driver)
    driver = null
  }
  await deleteFeatureByTitle(TEST_FEATURE_EDITED).catch(() => deleteFeatureByTitle(TEST_FEATURE_NAME))
  await deleteSystemByTitle(TEST_SYSTEM_NAME)
  log.info('Cleanup concluído')
}

export async function run(): Promise<void> {
  console.log('\n╔══════════════════════════════════╗')
  console.log('║   WEB TESTS: Feature             ║')
  console.log('╚══════════════════════════════════╝')
  try {
    await setup()
    await testCreateFeature()
    await testValidateDb()
    await testEditFeature()
    await testDeleteFeature()
  } finally {
    await cleanup()
  }
}

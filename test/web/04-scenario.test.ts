import { createDriver, fillInput, clickElement, waitForText, waitForTextGone, closeDriver, By, log, takeScreenshot } from './config/web-driver'
import { navigateViaMenu } from './config/nav-menu-helper'
import { findScenarioByTitle, deleteSystemByTitle, deleteFeatureByTitle, deleteStatusByTitle } from './config/db-helper'
import { request } from '../shared/api-client'
import { evidence } from '../shared/evidence'
import { System, Feature, ScenarioStatus, Scenario } from '../shared/types'
import { WebDriver } from 'selenium-webdriver'

const SUITE = '04-scenario'
const TEST_NAME = `TEST_SCN_WEB_${Date.now()}`
const TEST_NAME_EDITED = `${TEST_NAME}_EDIT`

const FILTER_SYSTEM_NAME  = `TEST_SYS_FILTER_${Date.now()}`
const FILTER_FEATURE_NAME = `TEST_FEAT_FILTER_${Date.now()}`
const FILTER_STATUS_NAME  = `TEST_STS_FILTER_${Date.now()}`
const FILTER_SCENARIO_NAME = `TEST_SCN_FILTER_${Date.now()}`

let driver: WebDriver | null = null
let filterScenarioId: number | null = null

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
    await navigateViaMenu(driver, 'Cenários', 'Cenários')
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

async function setupFilter(): Promise<void> {
  log.section('SETUP — criar dados para filtro via API')
  const sysRes = await request<System>('POST', '/api/system', { title: FILTER_SYSTEM_NAME })
  const systemId = sysRes.data?.id
  if (!systemId) throw new Error('Falha ao criar sistema de filtro')
  log.info(`Sistema de filtro criado (ID ${systemId})`)

  const featRes = await request<Feature>('POST', '/api/feature', { title: FILTER_FEATURE_NAME, system_id: systemId })
  const featureId = featRes.data?.id
  if (!featureId) throw new Error('Falha ao criar feature de filtro')
  log.info(`Feature de filtro criada (ID ${featureId})`)

  const stRes = await request<ScenarioStatus>('POST', '/api/config/status/scenario', { title: FILTER_STATUS_NAME })
  const statusId = stRes.data?.id
  if (!statusId) throw new Error('Falha ao criar status de filtro')
  log.info(`Status de filtro criado (ID ${statusId})`)

  const scRes = await request<Scenario>('POST', '/api/scenario', {
    title: FILTER_SCENARIO_NAME,
    system_ids: [systemId],
    feature_id: featureId,
    status_id: statusId,
    prerequisites: ['Pré-requisito de filtro'],
    expectations: ['Resultado esperado de filtro'],
  })
  filterScenarioId = scRes.data?.id ?? null
  if (!filterScenarioId) throw new Error('Falha ao criar cenário de filtro')
  log.info(`Cenário de filtro criado (ID ${filterScenarioId})`)
}

async function testFilterScenarios(): Promise<void> {
  log.section('WEB — Filtrar cenários')

  await step('13_navegar_para_cenarios_filtros', async () => {
    await navigateViaMenu(driver!, 'Cenários', 'Cenários')
    await waitForText(driver!, FILTER_SCENARIO_NAME)
  })

  await step('14_filtrar_por_sistema', async () => {
    const selects = await driver!.findElements(By.css('.filter-select'))
    await selects[0].findElement(By.xpath(`./option[contains(text(), "${FILTER_SYSTEM_NAME}")]`)).click()
    await driver!.sleep(500)
    await waitForText(driver!, FILTER_SCENARIO_NAME)
  })

  await step('15_limpar_filtro_sistema', async () => {
    await clickElement(driver!, By.xpath('//button[contains(text(),"Limpar")]'))
    await driver!.sleep(300)
  })

  await step('16_filtrar_por_feature', async () => {
    const selects = await driver!.findElements(By.css('.filter-select'))
    await selects[1].findElement(By.xpath(`./option[contains(text(), "${FILTER_FEATURE_NAME}")]`)).click()
    await driver!.sleep(500)
    await waitForText(driver!, FILTER_SCENARIO_NAME)
  })

  await step('17_limpar_filtro_feature', async () => {
    await clickElement(driver!, By.xpath('//button[contains(text(),"Limpar")]'))
    await driver!.sleep(300)
  })

  await step('18_filtrar_por_status', async () => {
    const selects = await driver!.findElements(By.css('.filter-select'))
    await selects[2].findElement(By.xpath(`./option[contains(text(), "${FILTER_STATUS_NAME}")]`)).click()
    await driver!.sleep(500)
    await waitForText(driver!, FILTER_SCENARIO_NAME)
  })

  await step('19_limpar_todos_filtros', async () => {
    await clickElement(driver!, By.xpath('//button[contains(text(),"Limpar")]'))
    await driver!.sleep(300)
    await waitForText(driver!, FILTER_SCENARIO_NAME)
  })
}

async function cleanupFilter(): Promise<void> {
  if (filterScenarioId) {
    await request('DELETE', `/api/scenario/${filterScenarioId}`).catch(() => {})
  }
  await deleteFeatureByTitle(FILTER_FEATURE_NAME).catch(() => {})
  await deleteSystemByTitle(FILTER_SYSTEM_NAME).catch(() => {})
  await deleteStatusByTitle(FILTER_STATUS_NAME).catch(() => {})
}

async function cleanup(): Promise<void> {
  log.section('CLEANUP')
  if (driver) {
    await closeDriver(driver)
    driver = null
  }
  await cleanupFilter()
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
    await setupFilter()
    await testFilterScenarios()
  } finally {
    await cleanup()
  }
}

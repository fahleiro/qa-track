import { createDriver, navigateTo, fillInput, clickElement, waitForText, closeDriver, selectOptionByText, By, log } from './config/web-driver'
import { findFeatureByTitle, deleteFeatureByTitle, deleteSystemByTitle } from './config/db-helper'
import { request } from '../shared/api-client'
import { System } from '../shared/types'
import { WebDriver } from 'selenium-webdriver'

const TEST_FEATURE_NAME = `TEST_FEATURE_WEB_${Date.now()}`
const TEST_SYSTEM_NAME  = `TEST_SYS_FOR_FEAT_WEB_${Date.now()}`
let driver: WebDriver | null = null

async function setup(): Promise<void> {
  log.section('SETUP — criar sistema via API')
  const res = await request<System>('POST', '/api/system', { title: TEST_SYSTEM_NAME })
  res.status === 201
    ? log.success(`Sistema "${TEST_SYSTEM_NAME}" criado`)
    : log.warn(`Sistema criado com status ${res.status}`)
}

async function testCreateFeature(): Promise<void> {
  log.section('WEB — Criar feature')

  driver = await createDriver()
  await navigateTo(driver, '/config')

  await clickElement(driver, By.xpath('//button[contains(text(), "Features")]'))
  log.info('Aba Features selecionada')

  await fillInput(driver, By.css('input[placeholder*="feature" i]'), TEST_FEATURE_NAME)
  await selectOptionByText(driver, By.css('select'), TEST_SYSTEM_NAME)
  await clickElement(driver, By.xpath('//button[contains(text(), "Adicionar") or contains(text(), "Add")]'))
  log.info(`Feature "${TEST_FEATURE_NAME}" enviada`)

  await waitForText(driver, TEST_FEATURE_NAME)
  log.success(`Feature "${TEST_FEATURE_NAME}" visível na UI`)
}

async function validateInDb(): Promise<void> {
  log.section('DB — Validar feature')
  const result = await findFeatureByTitle(TEST_FEATURE_NAME)
  result.exists
    ? log.success(`Feature encontrada no DB (ID ${result.data?.id})`)
    : log.error(`Feature "${TEST_FEATURE_NAME}" NÃO encontrada no DB`)
}

async function cleanup(): Promise<void> {
  log.section('CLEANUP')
  await closeDriver(driver!)
  driver = null
  await deleteFeatureByTitle(TEST_FEATURE_NAME)
  await deleteSystemByTitle(TEST_SYSTEM_NAME)
  log.info('Dados de teste removidos')
}

export async function run(): Promise<void> {
  console.log('\n╔══════════════════════════════════╗')
  console.log('║   WEB TESTS: Feature             ║')
  console.log('╚══════════════════════════════════╝')
  try {
    await setup()
    await testCreateFeature()
    await validateInDb()
  } finally {
    await cleanup()
  }
}

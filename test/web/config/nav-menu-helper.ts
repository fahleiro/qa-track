import { WebDriver, By, until } from 'selenium-webdriver'
import { CONFIG } from './web-driver'

// Computed CSS values matching App.css variables
const ACTIVE_COLOR  = 'rgba(26, 26, 26, 1)'     // --text: #1a1a1a
const INACTIVE_COLOR = 'rgba(115, 115, 115, 1)'  // --text-muted: #737373
const ACTIVE_BG     = 'rgba(245, 245, 245, 1)'   // --accent-light: #f5f5f5

export interface NavOption {
  text: string
  href: string
  isActive: boolean
  color: string
  background: string
}

async function getNavOptions(driver: WebDriver): Promise<NavOption[]> {
  const links = await driver.findElements(By.css('.header-nav a'))
  const options: NavOption[] = []
  for (const link of links) {
    const text       = (await link.getText()).trim()
    const href       = (await link.getAttribute('href')) ?? ''
    const className  = (await link.getAttribute('class')) ?? ''
    const color      = await link.getCssValue('color')
    const background = await link.getCssValue('background-color')
    const isActive   = className.includes('active')
    options.push({ text, href, isActive, color, background })
  }
  return options
}

function printNavOptions(options: NavOption[]): void {
  console.log('\n  [NAV] Opções do menu:')
  for (const opt of options) {
    const state = opt.isActive ? '● ATIVO  ' : '○ inativo'
    console.log(`    ${state}  "${opt.text}"  color=${opt.color}  bg=${opt.background}`)
  }
}

function validateInactiveOption(opt: NavOption): void {
  if (opt.color !== INACTIVE_COLOR) {
    throw new Error(
      `"${opt.text}" inativo com cor incorreta: esperado ${INACTIVE_COLOR}, obtido ${opt.color}`
    )
  }
}

function validateActiveOption(opt: NavOption, linkText: string): void {
  if (!opt.isActive) {
    throw new Error(`Link "${linkText}" não ficou ativo após clique (class .active ausente)`)
  }
  if (opt.color !== ACTIVE_COLOR) {
    throw new Error(
      `"${linkText}" ativo com cor incorreta: esperado ${ACTIVE_COLOR}, obtido ${opt.color}`
    )
  }
  if (opt.background !== ACTIVE_BG) {
    throw new Error(
      `"${linkText}" ativo com background incorreto: esperado ${ACTIVE_BG}, obtido ${opt.background}`
    )
  }
}

/**
 * Navega via clique no menu do header, validando:
 * - Presença e estado CSS de todas as opções (ativo/inativo)
 * - Transição de estado após o clique
 * - Título da página resultante (h1.page-title)
 */
export async function navigateViaMenu(
  driver: WebDriver,
  linkText: string,
  expectedPageTitle: string
): Promise<void> {
  // Garante que o app está carregado com o nav menu visível
  await driver.get(CONFIG.BASE_URL)
  await driver.sleep(800)

  // Imprime e valida estado inicial (antes do clique)
  const before = await getNavOptions(driver)
  if (before.length === 0) throw new Error('Nenhuma opção encontrada em .header-nav')
  printNavOptions(before)

  const targetBefore = before.find(o => o.text === linkText)
  if (!targetBefore) {
    throw new Error(
      `Link "${linkText}" não encontrado. Disponíveis: ${before.map(o => `"${o.text}"`).join(', ')}`
    )
  }

  // Valida que as opções inativas têm a cor correta
  for (const opt of before) {
    if (!opt.isActive) validateInactiveOption(opt)
  }

  // Clica no link alvo
  const links = await driver.findElements(By.css('.header-nav a'))
  for (const link of links) {
    const text = (await link.getText()).trim()
    if (text === linkText) {
      await link.click()
      break
    }
  }
  await driver.sleep(800)

  // Imprime e valida estado após o clique
  const after = await getNavOptions(driver)
  printNavOptions(after)

  const targetAfter = after.find(o => o.text === linkText)
  if (!targetAfter) throw new Error(`Opção "${linkText}" não encontrada após navegação`)
  validateActiveOption(targetAfter, linkText)

  // Valida que as demais opções ficaram inativas
  for (const opt of after) {
    if (opt.text !== linkText && !opt.isActive) validateInactiveOption(opt)
  }

  // Valida o título da página
  await driver.wait(until.elementLocated(By.css('h1.page-title')), 15000)
  const titleEl = await driver.findElement(By.css('h1.page-title'))
  const titleText = await titleEl.getText()
  if (titleText !== expectedPageTitle) {
    throw new Error(
      `Título da página incorreto: esperado "${expectedPageTitle}", obtido "${titleText}"`
    )
  }
  console.log(`  [NAV] Página carregada: "${titleText}" ✅`)
}

import { Builder, By, until, WebDriver, WebElement, Locator } from 'selenium-webdriver'
import * as chrome from 'selenium-webdriver/chrome'
import * as fs from 'fs'
import * as path from 'path'

export { By, until }

export interface DriverConfig {
  BASE_URL: string
  TIMEOUT: number
  IMPLICIT_WAIT: number
}

export const CONFIG: DriverConfig = {
  BASE_URL: process.env.QA_WEB_URL ?? 'http://localhost:5174',
  TIMEOUT: 15000,
  IMPLICIT_WAIT: 8000,
}

export async function createDriver(): Promise<WebDriver> {
  const options = new chrome.Options()
  if (process.env.HEADLESS !== 'false') {
    options.addArguments('--headless=new')
  }
  options.addArguments(
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--window-size=1920,1080',
  )
  if (process.env.CHROME_BIN) {
    options.setChromeBinaryPath(process.env.CHROME_BIN)
  }

  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build()
  await driver.manage().setTimeouts({
    implicit: CONFIG.IMPLICIT_WAIT,
    pageLoad: CONFIG.TIMEOUT,
    script: CONFIG.TIMEOUT,
  })
  return driver
}

export async function navigateTo(driver: WebDriver, path = ''): Promise<void> {
  await driver.get(`${CONFIG.BASE_URL}${path}`)
  await driver.sleep(800)
}

export async function waitForElement(driver: WebDriver, locator: Locator, timeout = CONFIG.TIMEOUT): Promise<WebElement> {
  return driver.wait(until.elementLocated(locator), timeout)
}

export async function waitForClickable(driver: WebDriver, locator: Locator, timeout = CONFIG.TIMEOUT): Promise<WebElement> {
  const el = await waitForElement(driver, locator, timeout)
  await driver.wait(until.elementIsVisible(el), timeout)
  await driver.wait(until.elementIsEnabled(el), timeout)
  return el
}

export async function fillInput(driver: WebDriver, locator: Locator, text: string): Promise<void> {
  const el = await waitForClickable(driver, locator)
  await el.clear()
  await el.sendKeys(text)
}

export async function clickElement(driver: WebDriver, locator: Locator): Promise<void> {
  const el = await waitForClickable(driver, locator)
  await el.click()
}

export async function getText(driver: WebDriver, locator: Locator): Promise<string> {
  const el = await waitForElement(driver, locator)
  return el.getText()
}

export async function findElements(driver: WebDriver, locator: Locator): Promise<WebElement[]> {
  return driver.findElements(locator)
}

export async function elementExists(driver: WebDriver, locator: Locator): Promise<boolean> {
  try {
    await driver.findElement(locator)
    return true
  } catch {
    return false
  }
}

export async function waitForText(driver: WebDriver, text: string, timeout = CONFIG.TIMEOUT): Promise<void> {
  await driver.wait(async () => {
    const body = await driver.findElement(By.tagName('body'))
    return (await body.getText()).includes(text)
  }, timeout)
}

export async function waitForTextGone(driver: WebDriver, text: string, timeout = CONFIG.TIMEOUT): Promise<void> {
  await driver.wait(async () => {
    const body = await driver.findElement(By.tagName('body'))
    return !(await body.getText()).includes(text)
  }, timeout)
}

export async function waitForPageLoad(driver: WebDriver): Promise<void> {
  await driver.wait(async () => {
    const state = await driver.executeScript('return document.readyState')
    return state === 'complete'
  }, CONFIG.TIMEOUT)
}

export async function selectOptionByText(driver: WebDriver, locator: Locator, text: string): Promise<void> {
  const select = await waitForClickable(driver, locator)
  await select.click()
  const option = await select.findElement(By.xpath(`./option[contains(text(), "${text}")]`))
  await option.click()
}

export async function takeScreenshot(driver: WebDriver, suite: string, step: string): Promise<string | null> {
  try {
    const screenshotsDir = path.resolve(__dirname, '../../reports/screenshots', suite)
    if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true })
    const safe = step.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    const filepath = path.join(screenshotsDir, `${safe}.png`)
    const data = await driver.takeScreenshot()
    fs.writeFileSync(filepath, data, 'base64')
    return filepath
  } catch {
    return null
  }
}

export async function closeDriver(driver: WebDriver): Promise<void> {
  if (driver) await driver.quit()
}

export const log = {
  success: (msg: string): void => console.log('✅', msg),
  error:   (msg: string): void => console.log('❌', msg),
  info:    (msg: string): void => console.log('ℹ️', msg),
  warn:    (msg: string): void => console.log('⚠️', msg),
  section: (msg: string): void => console.log(`\n===== ${msg} =====`),
}

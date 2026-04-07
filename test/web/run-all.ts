import { run as runSystem } from './01-system.test'
import { run as runFeature } from './02-feature.test'
import { run as runStatus } from './03-status.test'
import { run as runScenario } from './04-scenario.test'

async function main(): Promise<void> {
  console.log('\n╔════════════════════════════════════════════╗')
  console.log('║   QA TRACK — WEB TESTS (Selenium)          ║')
  console.log('╚════════════════════════════════════════════╝\n')

  const suites = [
    { name: '01-system',   fn: runSystem },
    { name: '02-feature',  fn: runFeature },
    { name: '03-status',   fn: runStatus },
    { name: '04-scenario', fn: runScenario },
  ]

  const failed: string[] = []

  for (const suite of suites) {
    try {
      await suite.fn()
    } catch (err) {
      console.error(`\n\x1b[31m✗ ${suite.name} falhou:\x1b[0m`, (err as Error).message)
      failed.push(suite.name)
    }
  }

  console.log('\n' + '═'.repeat(44))
  if (failed.length === 0) {
    console.log('\x1b[32m✓ Todos os testes web concluídos\x1b[0m')
  } else {
    console.log(`\x1b[31m✗ Falhas: ${failed.join(', ')}\x1b[0m`)
    process.exit(1)
  }
}

main()

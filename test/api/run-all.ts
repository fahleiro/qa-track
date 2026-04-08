import { run as runSystem } from './01-system.test'
import { run as runFeature } from './02-feature.test'
import { run as runScenario } from './03-scenario.test'
import { run as runConfigStatus } from './04-config-status.test'
import { run as runConfigExportImport } from './05-config-export-import.test'
import { run as runResultStatus } from './06-result-status.test'
import { run as runKanban } from './07-kanban.test'
import { run as runRun } from './08-run.test'
import { evidence } from '../shared/evidence'

async function main(): Promise<void> {
  console.log('\n╔════════════════════════════════════════════╗')
  console.log('║   QA TRACK — API TESTS                     ║')
  console.log('╚════════════════════════════════════════════╝\n')

  const suites = [
    { name: '01-system', fn: runSystem },
    { name: '02-feature', fn: runFeature },
    { name: '03-scenario', fn: runScenario },
    { name: '04-config-status', fn: runConfigStatus },
    { name: '05-config-export-import', fn: runConfigExportImport },
    { name: '06-result-status', fn: runResultStatus },
    { name: '07-kanban', fn: runKanban },
    { name: '08-run', fn: runRun },
  ]

  const failed: string[] = []

  for (const suite of suites) {
    evidence.setSuite(suite.name)
    try {
      await suite.fn()
    } catch (err) {
      console.error(`\n\x1b[31m✗ ${suite.name} falhou:\x1b[0m`, (err as Error).message)
      failed.push(suite.name)
    }
  }

  evidence.save('evidence-api.json')

  console.log('\n' + '═'.repeat(44))
  if (failed.length === 0) {
    console.log('\x1b[32m✓ Todos os testes concluídos\x1b[0m')
  } else {
    console.log(`\x1b[31m✗ Falhas: ${failed.join(', ')}\x1b[0m`)
    process.exit(1)
  }
}

main()

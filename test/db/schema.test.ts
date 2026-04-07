import { Client, ClientConfig } from 'pg'
import { log } from '../shared/logger'
import { evidence } from '../shared/evidence'

const DB_CONFIG: ClientConfig = {
  host:     process.env.DB_HOST     ?? 'localhost',
  port:     parseInt(process.env.P_POSTGRES ?? '5432'),
  database: process.env.DB_NAME     ?? 'qa_test_track',
  user:     process.env.DB_USER     ?? 'postgres',
  password: process.env.DB_PASSWORD ?? undefined,
}

interface ColumnSpec {
  type: string
  nullable: boolean
  default?: boolean
}

interface TableSpec {
  columns: Record<string, ColumnSpec>
  primaryKey: string[]
  unique?: string[]
  foreignKeys?: Array<{ column: string; references: string }>
}

const EXPECTED_SCHEMA: Record<string, TableSpec> = {
  t_system: {
    columns: {
      id:    { type: 'integer', nullable: false, default: true },
      title: { type: 'text',    nullable: false },
    },
    primaryKey: ['id'],
    unique: ['title'],
  },
  t_feature: {
    columns: {
      id:        { type: 'integer', nullable: false, default: true },
      title:     { type: 'text',    nullable: false },
      system_id: { type: 'integer', nullable: false },
    },
    primaryKey: ['id'],
    unique: ['title'],
    foreignKeys: [{ column: 'system_id', references: 't_system(id)' }],
  },
  t_scenario_status: {
    columns: {
      id:    { type: 'integer', nullable: false, default: true },
      title: { type: 'text',    nullable: false },
    },
    primaryKey: ['id'],
    unique: ['title'],
  },
  t_scenario: {
    columns: {
      id:         { type: 'integer', nullable: false, default: true },
      title:      { type: 'text',    nullable: false },
      status_id:  { type: 'integer', nullable: true },
      feature_id: { type: 'integer', nullable: true },
    },
    primaryKey: ['id'],
    unique: ['title'],
    foreignKeys: [
      { column: 'status_id',  references: 't_scenario_status(id)' },
      { column: 'feature_id', references: 't_feature(id)' },
    ],
  },
  t_scenario_system: {
    columns: {
      scenario_id: { type: 'integer', nullable: false },
      system_id:   { type: 'integer', nullable: false },
    },
    primaryKey: ['scenario_id', 'system_id'],
    foreignKeys: [
      { column: 'scenario_id', references: 't_scenario(id)' },
      { column: 'system_id',   references: 't_system(id)' },
    ],
  },
  t_scenario_pre: {
    columns: {
      id:          { type: 'integer', nullable: false, default: true },
      scenario_id: { type: 'integer', nullable: false },
      description: { type: 'text',    nullable: false },
    },
    primaryKey: ['id'],
    foreignKeys: [{ column: 'scenario_id', references: 't_scenario(id)' }],
  },
  t_scenario_expect: {
    columns: {
      id:          { type: 'integer', nullable: false, default: true },
      scenario_id: { type: 'integer', nullable: false },
      description: { type: 'text',    nullable: false },
    },
    primaryKey: ['id'],
    foreignKeys: [{ column: 'scenario_id', references: 't_scenario(id)' }],
  },
}

interface PgColumn {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
}

async function validateTable(client: Client, tableName: string, spec: TableSpec): Promise<void> {
  log.section(`Tabela: ${tableName}`)

  const colResult = await client.query<PgColumn>(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = $1 AND table_schema = 'public'
    ORDER BY ordinal_position
  `, [tableName])

  if (colResult.rows.length === 0) {
    log.error(`Tabela ${tableName} não encontrada`)
    evidence.addDb({ table: tableName, check: 'tabela existe', passed: false })
    return
  }

  evidence.addDb({ table: tableName, check: 'tabela existe', passed: true })

  for (const [colName, colSpec] of Object.entries(spec.columns)) {
    const col = colResult.rows.find(r => r.column_name === colName)
    if (!col) {
      log.error(`  Coluna "${colName}" não encontrada`)
      evidence.addDb({ table: tableName, check: `coluna ${colName} existe`, passed: false })
      continue
    }

    const typeOk = col.data_type === colSpec.type || col.data_type.includes(colSpec.type.split(' ')[0])
    const nullOk = (col.is_nullable === 'NO') === !colSpec.nullable
    const passed = typeOk && nullOk

    if (passed) {
      log.success(`  ${colName}: ${col.data_type} / nullable=${col.is_nullable === 'YES'}`)
    } else {
      if (!typeOk) log.error(`  ${colName}: tipo esperado "${colSpec.type}", encontrado "${col.data_type}"`)
      if (!nullOk) log.error(`  ${colName}: nullable esperado ${colSpec.nullable}, encontrado ${col.is_nullable === 'YES'}`)
    }
    evidence.addDb({ table: tableName, check: `coluna ${colName} (type+nullable)`, passed })
  }
}

async function run(): Promise<void> {
  console.log('\n╔══════════════════════════════════╗')
  console.log('║   DB SCHEMA VALIDATION           ║')
  console.log('╚══════════════════════════════════╝')

  evidence.setSuite('db-schema')
  const client = new Client(DB_CONFIG)
  await client.connect()
  log.success('Conectado ao PostgreSQL')

  try {
    for (const [table, spec] of Object.entries(EXPECTED_SCHEMA)) {
      await validateTable(client, table, spec)
    }
  } finally {
    await client.end()
    log.info('Conexão encerrada')
  }

  evidence.save('evidence-db.json')
}

run().catch(err => {
  evidence.save('evidence-db.json')
  console.error('\x1b[31m✗ Schema test falhou:\x1b[0m', err.message)
  process.exit(1)
})

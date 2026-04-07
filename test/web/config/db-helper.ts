import { Client, ClientConfig } from 'pg'
import { System, Feature, ScenarioStatus, Scenario, DbQueryResult } from '../../shared/types'

const DB_CONFIG: ClientConfig = {
  host:     process.env.DB_HOST     ?? 'localhost',
  port:     parseInt(process.env.P_POSTGRES ?? '5432'),
  database: process.env.DB_NAME     ?? 'qa_test_track',
  user:     process.env.DB_USER     ?? 'postgres',
  password: process.env.DB_PASSWORD ?? undefined,
}

async function createConnection(): Promise<Client> {
  const client = new Client(DB_CONFIG)
  await client.connect()
  return client
}

async function closeConnection(client: Client): Promise<void> {
  await client.end()
}

export async function findSystemByTitle(title: string): Promise<DbQueryResult<System>> {
  const client = await createConnection()
  try {
    const result = await client.query<System>('SELECT * FROM t_system WHERE title = $1', [title])
    return { exists: result.rows.length > 0, data: result.rows[0] ?? null }
  } finally {
    await closeConnection(client)
  }
}

export async function findFeatureByTitle(title: string): Promise<DbQueryResult<Feature>> {
  const client = await createConnection()
  try {
    const result = await client.query<Feature>('SELECT * FROM t_feature WHERE title = $1', [title])
    return { exists: result.rows.length > 0, data: result.rows[0] ?? null }
  } finally {
    await closeConnection(client)
  }
}

export async function findStatusByTitle(title: string): Promise<DbQueryResult<ScenarioStatus>> {
  const client = await createConnection()
  try {
    const result = await client.query<ScenarioStatus>('SELECT * FROM t_scenario_status WHERE title = $1', [title])
    return { exists: result.rows.length > 0, data: result.rows[0] ?? null }
  } finally {
    await closeConnection(client)
  }
}

export async function findScenarioByTitle(title: string): Promise<DbQueryResult<Scenario>> {
  const client = await createConnection()
  try {
    const result = await client.query<Scenario>('SELECT * FROM t_scenario WHERE title = $1', [title])
    return { exists: result.rows.length > 0, data: result.rows[0] ?? null }
  } finally {
    await closeConnection(client)
  }
}

export async function getScenariosBySystem(systemId: number): Promise<Scenario[]> {
  const client = await createConnection()
  try {
    const result = await client.query<Scenario>(`
      SELECT s.* FROM t_scenario s
      INNER JOIN t_scenario_system ss ON s.id = ss.scenario_id
      WHERE ss.system_id = $1 ORDER BY s.id DESC
    `, [systemId])
    return result.rows
  } finally {
    await closeConnection(client)
  }
}

export async function deleteSystemByTitle(title: string): Promise<boolean> {
  const client = await createConnection()
  try {
    const result = await client.query('DELETE FROM t_system WHERE title = $1 RETURNING id', [title])
    return result.rows.length > 0
  } finally {
    await closeConnection(client)
  }
}

export async function deleteFeatureByTitle(title: string): Promise<boolean> {
  const client = await createConnection()
  try {
    const result = await client.query('DELETE FROM t_feature WHERE title = $1 RETURNING id', [title])
    return result.rows.length > 0
  } finally {
    await closeConnection(client)
  }
}

export async function deleteStatusByTitle(title: string): Promise<boolean> {
  const client = await createConnection()
  try {
    const result = await client.query('DELETE FROM t_scenario_status WHERE title = $1 RETURNING id', [title])
    return result.rows.length > 0
  } finally {
    await closeConnection(client)
  }
}

export async function executeQuery<T = unknown>(query: string, params: unknown[] = []): Promise<T[]> {
  const client = await createConnection()
  try {
    const result = await client.query<T>(query, params)
    return result.rows
  } finally {
    await closeConnection(client)
  }
}

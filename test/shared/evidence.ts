import * as fs from 'fs'
import * as path from 'path'

export interface ApiEvidence {
  suite: string
  method: string
  url: string
  requestBody: unknown
  responseStatus: number
  responseBody: unknown
  timestamp: string
}

export interface WebEvidence {
  suite: string
  step: string
  screenshotPath: string | null
  passed: boolean
  timestamp: string
}

export interface DbEvidence {
  table: string
  check: string
  passed: boolean
  timestamp: string
}

export interface EvidenceFile {
  startedAt: string
  finishedAt: string
  api?: ApiEvidence[]
  web?: WebEvidence[]
  db?: DbEvidence[]
}

class EvidenceCollector {
  private _suite = 'unknown'
  api: ApiEvidence[] = []
  web: WebEvidence[] = []
  db: DbEvidence[] = []
  startedAt = new Date().toISOString()

  setSuite(name: string): void { this._suite = name }
  get suite(): string { return this._suite }

  addApi(e: Omit<ApiEvidence, 'suite' | 'timestamp'>): void {
    this.api.push({ ...e, suite: this._suite, timestamp: new Date().toISOString() })
  }

  addWeb(e: Omit<WebEvidence, 'timestamp'>): void {
    this.web.push({ ...e, timestamp: new Date().toISOString() })
  }

  addDb(e: Omit<DbEvidence, 'timestamp'>): void {
    this.db.push({ ...e, timestamp: new Date().toISOString() })
  }

  save(filename: string): void {
    const dir = path.resolve(__dirname, '../reports')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const file: EvidenceFile = {
      startedAt: this.startedAt,
      finishedAt: new Date().toISOString(),
      api: this.api.length ? this.api : undefined,
      web: this.web.length ? this.web : undefined,
      db: this.db.length ? this.db : undefined,
    }
    fs.writeFileSync(path.join(dir, filename), JSON.stringify(file, null, 2))
  }
}

export const evidence = new EvidenceCollector()

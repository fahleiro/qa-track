export interface System {
  id: number
  title: string
}

export interface Feature {
  id: number
  title: string
  system_id: number
  system_title?: string
}

export interface ScenarioStatus {
  id: number
  title: string
}

export interface Pre {
  id: number
  scenario_id: number
  description: string
}

export interface Expect {
  id: number
  scenario_id: number
  description: string
}

export interface Scenario {
  id: number
  title: string
  status_id?: number
  feature_id?: number
  status?: ScenarioStatus
  feature?: Feature
  systems?: System[]
  prerequisites?: Pre[]
  expectations?: Expect[]
}

export interface ResultStatus {
  id: number
  title: string
}

export interface RunStatus {
  id: number
  title: string
}

export interface CardStatus {
  id: number
  title: string
  order: number
  triggers_run_status_id: number | null
}

export interface Card {
  id: number
  title: string
  description?: string
  system_id: number
  feature_id: number
  card_status_id: number
  run_id?: number
  card_status?: CardStatus
  system?: System
  feature?: Feature
  run?: {
    id: number
    status_id: number
    status_title: string
    scenario_count: number
  }
  runCreated?: boolean
  runInfo?: { id: number; scenarioCount: number }
}

export interface RunDetail {
  id: number
  scenario_id: number
  scenario_title: string
  result_status_id: number
  result_status_title: string
}

export interface Run {
  id: number
  title: string
  status_id: number
  status_title: string
  card_id?: number
  card_title?: string
  scenario_count: number
  passed_count: number
  scenarios?: RunDetail[]
}

export interface ApiResponse<T = unknown> {
  status: number
  data: T | null
}

export interface DbQueryResult<T> {
  exists: boolean
  data: T | null
}

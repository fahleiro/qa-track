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

export interface ApiResponse<T = unknown> {
  status: number
  data: T | null
}

export interface DbQueryResult<T> {
  exists: boolean
  data: T | null
}

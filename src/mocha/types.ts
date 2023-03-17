export interface TestReport {
  stats: TestStats
  tests: MochaTest[]
  pending: MochaTest[]
  failures: MochaTest[]
  passes: MochaTest[]
}

export interface TestStats {
  suites: number
  tests: number
  passes: number
  pending: number
  failures: number
  start: string
  end: string
  duration: number
}

export interface MochaError {
  message: string
  name?: string
}

export interface MochaTest {
  title: string
  fullTitle: string
  duration?: number
  currentRetry: number
  err: Record<never, unknown> | MochaError
}

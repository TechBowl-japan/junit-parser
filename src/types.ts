export type DateTime = string

export interface JUnitTestReport {
  id?: number
  package?: string
  name?: string
  time?: DateTime
  tests: number
  failures: number
  errors: number
  suites: JUnitTestSuite[]
}

export interface JUnitTestSuite {
  id?: number
  name?: string
  time?: DateTime
  failures: number
  errors: number
  tests: JUnitTestCase[]
  properties: Record<string, string>
  systemOut?: string
  systemErr?: string
  // NOTE: ネストされた<testsuite>を表現するためのフィールド
  testReport?: JUnitTestReport
}

export interface JUnitTestCase {
  id?: number
  name?: string
  time?: DateTime
  failure?: JUnitFailure
  error?: JUnitFailure
}

export interface JUnitFailure {
  message: string
  type: string
  content: string
}

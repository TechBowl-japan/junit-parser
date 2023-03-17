import type { MochaError, TestReport } from './types.js'
import type { JUnitFailure, JUnitTestReport, JUnitTestSuite } from '../types.js'

const flattenTestSuites = (
  suites: JUnitTestSuite[],
  prefix = '',
): JUnitTestSuite[] => {
  const res: JUnitTestSuite[] = []

  for (const suite of suites) {
    const name = prefix + (suite.name ?? '(unnamed)')
    res.push({
      ...suite,
      name,
    })

    if (suite.testReport) {
      res.push(...flattenTestSuites(suite.testReport.suites, name + '::'))
    }
  }

  return res
}

const convertError = (
  error: JUnitFailure | undefined,
): MochaError | undefined => {
  if (!error) {
    return undefined
  }

  return {
    ...error,
    message: [error.message, error.content].filter(Boolean).join('\n'),
  }
}

export const transformJUnitTestReport = (
  res: JUnitTestReport,
  rawJUnitFile?: string,
): TestReport => {
  const suites = flattenTestSuites(res.suites)
  const tests = suites.flatMap(s =>
    s.tests.map(c => ({
      title: c.name ?? 'unnamed',
      fullTitle: c.name ?? 'unnamed',
      currentRetry: 0,
      err: convertError(c.failure || c.error) || {},
      _hasError: !!(c.failure || c.error),
    })),
  )
  return {
    stats: {
      suites: res.suites.length,
      tests: res.tests,
      passes: res.tests - (res.failures + (res.errors ?? 0)),
      pending: 0,
      failures: res.failures + (res.errors ?? 0),
      start: '',
      end: '',
      duration: 0,
    },
    tests,
    pending: [],
    failures: tests.filter(t => t._hasError),
    passes: tests.filter(t => !t._hasError),
    // デバッグ用に追加。
    __rawJUnitFile: rawJUnitFile,
  } as TestReport
}

import { XMLParser } from 'fast-xml-parser'
import {
  JUnitFailure,
  JUnitTestCase,
  JUnitTestReport,
  JUnitTestSuite,
} from '~/types'
import * as he from 'he'

interface XMLNode {
  __attr?: Record<string, string>
  __text?: string
  testsuite?: XMLNode
  [children: string]: unknown
}

export const visitFailure = (failure: XMLNode | string): JUnitFailure => {
  if (typeof failure === 'string') {
    return {
      message: '',
      type: '',
      content: failure,
    }
  }

  const message = failure.__attr?.message ?? ''
  const type = failure.__attr?.type ?? ''
  const content = he.decode(failure.__text ?? '')

  return {
    message,
    type,
    content,
  }
}

const visitTestCase = (testCase: XMLNode): JUnitTestCase => {
  const output: JUnitTestCase = {
    id: testCase.__attr?.id ? parseInt(testCase.__attr.id) : undefined,
    name: testCase.__attr?.name,
    time: testCase.__attr?.time,
  }

  const { failure, error } = testCase

  if (failure instanceof Array) {
    throw new Error('<testcase> should have one <failure> tag')
  }

  output.failure = failure
    ? visitFailure(failure as XMLNode | string)
    : undefined

  if (error instanceof Array) {
    throw new Error('<testcase> should have one <failure> tag')
  }

  output.error = error ? visitFailure(error as XMLNode | string) : undefined

  return output
}

const visitTestSuite = (testSuite: XMLNode): JUnitTestSuite => {
  let testReport: undefined | JUnitTestReport = undefined

  // NOTE: <testsuite>の中に<testsuite>を入れる実装があるらしい クソPHPめ
  if ('testsuite' in testSuite) {
    testReport = visitTestReport(testSuite)
  }

  const output: JUnitTestSuite = {
    id: testSuite.__attr?.id ? parseInt(testSuite.__attr.id) : undefined,
    name: testSuite.__attr?.name,
    time: testSuite.__attr?.time,
    properties: {},
    tests: [],
    failures: testSuite.__attr?.failures
      ? parseInt(testSuite.__attr.failures)
      : NaN,
    errors: testSuite.__attr?.errors ? parseInt(testSuite.__attr.errors) : 0,
    systemOut:
      (testSuite['system-out'] as XMLNode)?.__text ??
      (typeof testSuite['system-out'] === 'string'
        ? testSuite['system-out']
        : undefined),
    systemErr:
      (testSuite['system-err'] as XMLNode)?.__text ??
      (typeof testSuite['system-err'] === 'string'
        ? testSuite['system-err']
        : undefined),
    testReport,
  }

  const testcase = testSuite['testcase']

  if (testcase instanceof Array) {
    output.tests = (testcase as XMLNode[]).map(visitTestCase)
  } else if (testcase) {
    output.tests.push(visitTestCase(testcase as XMLNode))
  }

  if (isNaN(output.failures)) {
    output.failures = output.tests.reduce(
      (acc, v) => acc + (v.failure ? 1 : 0),
      0,
    )
  }

  return output
}

const visitTestReport = (testReport: XMLNode): JUnitTestReport => {
  const output: JUnitTestReport = {
    id: testReport.__attr?.id ? parseInt(testReport.__attr.id) : undefined,
    package: testReport.__attr?.package,
    name: testReport.__attr?.name,
    time: testReport.__attr?.time,
    tests: testReport.__attr?.tests ? parseInt(testReport.__attr.tests) : NaN,
    failures: testReport.__attr?.failures
      ? parseInt(testReport.__attr.failures)
      : NaN,
    errors: testReport.__attr?.errors ? parseInt(testReport.__attr.errors) : 0,
    suites: [],
  }

  const testsuite = testReport['testsuite']
  if (testsuite instanceof Array) {
    output.suites = (testsuite as XMLNode[]).map(visitTestSuite)
  } else if (testsuite) {
    output.suites.push(visitTestSuite(testsuite))
  }

  if (isNaN(output.tests) || isNaN(output.failures)) {
    const [tests, failures, errors] = output.suites.reduce(
      ([t, f, e], v) => [
        t + v.tests.length + (v.testReport?.tests ?? 0),
        f + v.failures,
        e + (v.errors ?? 0),
      ],
      [0, 0, 0],
    )

    output.tests = tests
    output.failures = failures
    output.errors = errors
  }

  return output
}

const parseJUnitTestReportIntoJson = (xmlData: string): XMLNode => {
  const res: unknown = new XMLParser({
    attributesGroupName: '__attr',
    textNodeName: '__text',
    attributeNamePrefix: '',
    ignoreAttributes: false,
    removeNSPrefix: false,
    allowBooleanAttributes: true,
    attributeValueProcessor: (_, val) =>
      he.decode(val, { isAttributeValue: true }), //default is a=>a
    tagValueProcessor: (_, val) => he.decode(val), //default is a=>a
    stopNodes: ['failure', 'error', 'system-out', 'system-err'],
  }).parse(xmlData)
  return res as XMLNode
}

export const parseJUnitTestReport = (xmlData: string) => {
  const report = parseJUnitTestReportIntoJson(xmlData)

  // NOTE: 1つのテストしかない場合に<testsuites>で返さない実装がある？
  if (report['testsuite']) {
    const testsuite = visitTestSuite(report['testsuite'])

    return {
      id: testsuite.id,
      name: testsuite.name,
      time: testsuite.time,
      tests: testsuite.tests.length + (testsuite.testReport?.tests ?? 0),
      failures: testsuite.failures,
      errors: testsuite.errors,
      suites: [testsuite],
    } as JUnitTestReport
  }

  const testsuites = report['testsuites']
  if (!testsuites) {
    throw new Error('empty test report')
  }

  if (testsuites instanceof Array) {
    throw new Error('root should have a single node of <testsuites>')
  }

  return visitTestReport(testsuites as XMLNode)
}

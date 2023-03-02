import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import { parseJUnitTestReport } from '~/index'

const kParserSpecAllTestCasesCount = 34

describe('parseJUnitTestReport', () => {
  for (let i = 0; i < kParserSpecAllTestCasesCount; ++i) {
    const input = fs
      .readFileSync(
        `${__dirname}/testcases/${String(i + 1).padStart(2, '0')}-report.xml`,
      )
      .toString()
    const inputJson = fs
      .readFileSync(
        `${__dirname}/testcases/${String(i + 1).padStart(2, '0')}-report.json`,
      )
      .toString()

    it(`parses "/testcases/${String(i + 1).padStart(
      2,
      '0',
    )}-report.json" correctly`, () => {
      const output = parseJUnitTestReport(input)
      expect(output).toEqual(JSON.parse(inputJson))
    })
  }
})

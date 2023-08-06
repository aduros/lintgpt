import fs from 'fs/promises'

import type { LintResult } from './lint'

export async function fixProblems (result: LintResult): Promise<number> {
  const fixedLines = result.fileLines.slice()
  let fixCount = 0

  for (const problem of result.problems) {
    if (problem.replacedCharacters) {
      const originalCode = result.fileLines[problem.lineNumber - 1]
      if (originalCode) {
        fixedLines[problem.lineNumber - 1] = originalCode.replace(problem.problemCharacters, problem.replacedCharacters)
        ++fixCount
      }
    }
  }

  if (fixCount > 0) {
    await fs.writeFile(result.fileName, fixedLines.join('\n'))
  }

  return fixCount
}

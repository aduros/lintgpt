import kleur from 'kleur'

import type { LintResult } from './lint'

export interface PrintSummaryOptions {
  problemCounts: Record<string, number>
  cost?: string | undefined
}

export function printResult (result: LintResult): void {
  // console.log(result.fileName, result.problems)

  for (const problem of result.problems) {
    console.log(`${kleur.red('✘')} ${kleur.bold(problem.description)}`)
    console.log()

    const line = result.fileLines[problem.lineNumber - 1]
    const startIdx = (line != null)
      ? line.indexOf(problem.problemCharacters)
      : -1

    console.log(`    ${kleur.cyan(result.fileName)}:${kleur.yellow(problem.lineNumber)}:${kleur.yellow(Math.max(startIdx, 0) + 1)}`)

    if (line != null) {
      console.log(`      ${kleur.yellow(problem.lineNumber)} ${kleur.black('│')} ${line}`)
      if (startIdx >= 0) {
        console.log(`      ${' '.repeat(problem.lineNumber.toString().length)} ${kleur.black('│')} ${' '.repeat(startIdx)}${kleur.red('~'.repeat(problem.problemCharacters.length))}`)
      }
    }
    console.log()
  }
}

export function printSummary (opts: PrintSummaryOptions): void {
  const totalProblems = Object.values(opts.problemCounts).reduce((sum, count) => sum + count, 0)

  if (totalProblems > 0) {
    const problemFiles = Object.keys(opts.problemCounts)
    const fileOrFiles = (problemFiles.length > 1)
      ? `${problemFiles.length} file${problemFiles.length !== 1 ? 's' : ''}`
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      : problemFiles[0]!

    process.stdout.write(`Found ${totalProblems} problem${totalProblems !== 1 ? 's' : ''} in ${fileOrFiles}.`)
  }

  if (opts.cost) {
    if (totalProblems > 0) {
      process.stdout.write(' ')
    }
    process.stdout.write(`Spent ${opts.cost} on OpenAI.`)
  }

  process.stdout.write('\n')
}

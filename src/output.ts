import kleur from 'kleur'

import type { LintResult } from './lint'

export type OutputFormat = 'pretty' | 'raw'

export interface PrintResultOptions {
  result: LintResult
  fixed: boolean
  format: OutputFormat
}

export interface PrintSummaryOptions {
  problemCounts: Record<string, number>
  cost?: string | undefined
}

function printRawResult ({ fixed, result }: PrintResultOptions): void {
  for (const problem of result.problems) {
    if (!fixed || !problem.replacedCharacters) {
      const line = result.fileLines[problem.lineNumber - 1]
      const startColumn = (line != null)
        ? Math.max(line.indexOf(problem.problemCharacters) + 1, 1)
        : 1
      const endColumn = startColumn + problem.problemCharacters.length - 1
      console.log(`${result.fileName}:${problem.lineNumber}-${problem.lineNumber}:${startColumn}-${endColumn}: error: ${problem.description}`)
    }
  }
}

function printPrettyResult ({ fixed, result }: PrintResultOptions): void {
  for (const problem of result.problems) {
    process.stdout.write(fixed && problem.replacedCharacters ? kleur.yellow('✔') : kleur.red('✘'))
    console.log(` ${kleur.bold(problem.description)}`)
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

        if (fixed && problem.replacedCharacters) {
          console.log(`    ${kleur.bold('Fixed:')}`)
          console.log(`      ${' '.repeat(problem.lineNumber.toString().length)} ${kleur.black('│')} ${line.substring(0, startIdx)}${kleur.green(problem.replacedCharacters)}${line.substring(startIdx + problem.problemCharacters.length)}`)
        }
      }
    }

    console.log()
  }
}

export function printResult (opts: PrintResultOptions): void {
  switch (opts.format) {
    case 'pretty':
      printPrettyResult(opts)
      break
    case 'raw':
      printRawResult(opts)
      break
    default:
      opts.format satisfies never
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

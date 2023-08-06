#!/usr/bin/env node

import { Configuration, OpenAIApi } from 'openai'

import { lint } from './lint'
import { printResult, type PrintSummaryOptions, printSummary } from './output'

import { program } from 'commander'
import { type Options as GlobbyOptions, globbyStream } from 'globby'
import fastq from 'fastq'
import ora from 'ora'
import kleur from 'kleur'
import { calculateCost } from './cost'
import { fixProblems } from './fix'

program
  .name('lintgpt')
  .option('--model <model>', 'OpenAI model to use', 'gpt-4')
  .option('--concurrency <concurrency>', 'Number of files to process in parallel', parseFloat, 8)
  .option('--show-cost', 'If OpenAIh requests were made, show the total cost spent', false)
  .option('--fix', 'Automatically fix problems')
  .argument('[file-patterns...]', 'Files to check for problems')
  .action(async (filePatterns: string[], opts) => {
    if (filePatterns.length === 0) {
      program.help()
    }

    const {
      concurrency,
      fix,
      model,
      showCost,
    } = opts as {
      concurrency: number
      fix: boolean
      model: string
      showCost: boolean
    }

    const spinner = ora().start()
    let progressTotal = 0
    let progress = 0

    function updateSpinner (): void {
      spinner.text = `Checked ${progress} of ${progressTotal} files...`
    }

    function clearSpinner (): void {
      if (spinner.isSpinning) {
        process.stdout.write('\x1b[2K\r') // ANSI magic to clear the spinner
      }
    }

    process.on('uncaughtException', (error) => {
      clearSpinner()
      console.error(`${kleur.red('✘')} ${error.message}`)
      process.exit(1)
    })

    const apiKey = process.env['OPENAI_API_KEY']
    if (!apiKey) {
      throw new Error('Environment variable $OPENAI_API_KEY must be set.')
    }

    const summary: PrintSummaryOptions = {
      problemCounts: {},
    }
    let spentOutputTokens = 0
    let spentInputTokens = 0

    const openai = new OpenAIApi(new Configuration({
      apiKey,
    }))

    const queue = fastq.promise(async (fileName: string) => {
      const result = await lint(fileName, {
        openai,
        model,
      })

      // await new Promise(resolve => {
      //   setTimeout(resolve, 2000)
      // })

      let unfixedProblemCount = result.problems.length
      if (fix) {
        unfixedProblemCount -= await fixProblems(result)
      }

      if (result.problems.length) {
        clearSpinner()
        printResult({
          result,
          fixed: fix,
        })
        console.log()
      }

      if (unfixedProblemCount > 0) {
        summary.problemCounts[fileName] = unfixedProblemCount
      }

      spentInputTokens += result.spentInputTokens
      spentOutputTokens += result.spentOutputTokens

      ++progress
      updateSpinner()
    }, concurrency)

    // Handle errors with the global error handler
    queue.error(error => {
      if (error != null) {
        throw error
      }
    })

    const globbyOpts: GlobbyOptions = {
      gitignore: true,
      ignoreFiles: '.lintgptignore',
    }
    for await (const fileName of globbyStream(filePatterns, globbyOpts)) {
      void queue.push(fileName.toString())
      ++progressTotal
      updateSpinner()
    }

    await queue.drained()
    spinner.stop()

    if (showCost) {
      summary.cost = calculateCost({
        spentInputTokens,
        spentOutputTokens,
        model,
      })
    }

    printSummary(summary)
    process.exit(Object.keys(summary.problemCounts).length > 0 ? 1 : 0)
  })

program.parse()

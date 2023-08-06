import JSON5 from 'json5'
import fs from 'fs/promises'
import path from 'path'
import type { OpenAIApi } from 'openai'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

import { addToCache, getCacheDir, getCacheKey, getFromCache } from './cache'

const problemSchema = z.object({
  lineNumber: z.number().describe('The line number containing this problem'),
  description: z.string().describe('A description of this problem. Exclude references to the line number'),
  problemCharacters: z.string().describe('The smallest region of the problematic code'),
  replacedCharacters: z.string().describe('Suggested replacement of the problem region to fix').optional(),
}).describe('Object describing a single problem')

export type Problem = z.infer<typeof problemSchema>

export interface LintOptions {
  openai: OpenAIApi
  model: string
}

export interface LintResult {
  fileName: string
  fileLines: string[]
  problems: Problem[]
  spentInputTokens: number
  spentOutputTokens: number
}

export async function lint (fileName: string, opts: LintOptions): Promise<LintResult> {
  const cacheDir = getCacheDir()
  const stats = await fs.stat(fileName)

  const cacheKey = getCacheKey({
    fileName,
    stats,
    model: opts.model,
  })

  let problems: Problem[] | undefined
  if (cacheDir != null) {
    const cacheData = await getFromCache(cacheDir, cacheKey)
    problems = cacheData?.problems
  }

  const fileLines = (problems?.length === 0)
    ? [] // If no problems, avoid reading the file
    : (await fs.readFile(fileName, 'utf8')).split('\n')

  let spentInputTokens = 0
  let spentOutputTokens = 0

  if (problems == null) {
    const filePrompt = [
      `${path.basename(fileName)}:`,
      '',
      ...fileLines.map((line, lineIdx) => `#${lineIdx + 1} | ${line}`),
    ].join('\n')

    const parametersSchema = z.object({
      problems: z.array(problemSchema).describe('List of problems, if any'),
    })

    // console.log(filePrompt)
    // console.log('FETCHING!', fileName)

    const completion = await opts.openai.createChatCompletion({
      model: opts.model,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: 'Detect problems in the given program. Be as terse as possible.',
        },
        {
          role: 'user',
          content: filePrompt,
        },
      ],
      functions: [
        {
          name: 'listProblems',
          description: 'Called when problems are detected in the given program',
          parameters: zodToJsonSchema(parametersSchema),
        },
      ],
      function_call: {
        name: 'listProblems',
      },
    })

    if (completion.data.usage != null) {
      spentInputTokens = completion.data.usage.prompt_tokens
      spentOutputTokens = completion.data.usage.completion_tokens
    }

    const functionCall = completion.data.choices[0]?.message?.function_call

    problems = (functionCall?.arguments != null)
      ? parametersSchema.parse(JSON5.parse(functionCall.arguments)).problems
      : []

    if (cacheDir != null) {
      await addToCache(cacheDir, cacheKey, { problems })
    }
  }

  return {
    fileName,
    fileLines,
    problems,
    spentInputTokens,
    spentOutputTokens,
  }
}

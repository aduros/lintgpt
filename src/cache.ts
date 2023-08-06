import cacache from 'cacache'
import findCacheDir from 'find-cache-dir'
import path from 'path'
import type { Stats } from 'fs'

import type { Problem } from './lint'

export interface CacheData {
  problems: Problem[]
}

export interface GetCacheKeyOptions {
  fileName: string
  model: string
  stats: Stats
}

const cacheDataVersion = 1

export async function getFromCache (cacheDir: string, cacheKey: string): Promise<CacheData | undefined> {
  try {
    const item = await cacache.get(cacheDir, cacheKey)
    return JSON.parse(item.data.toString())
  } catch {
    return undefined
  }
}

export async function addToCache (cacheDir: string, cacheKey: string, data: CacheData): Promise<void> {
  await cacache.put(cacheDir, cacheKey, JSON.stringify(data))
}

export function getCacheKey (opts: GetCacheKeyOptions): string {
  return JSON.stringify({
    file: path.resolve(opts.fileName),
    model: opts.model,
    mtime: opts.stats.mtime,
    size: opts.stats.size,
    v: cacheDataVersion,
  })
}

export function getCacheDir (): string | undefined {
  return findCacheDir({ name: 'lintgpt' })
}

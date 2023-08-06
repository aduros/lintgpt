interface CalculateCostOptions {
  spentInputTokens: number
  spentOutputTokens: number
  model: string
}

export function calculateCost (opts: CalculateCostOptions): string | undefined {
  // TODO(2023-08-06): Support other model costs
  const dollars = 0.03 * opts.spentInputTokens / 1000 + 0.06 * opts.spentOutputTokens / 1000

  return (dollars > 0)
    ? `$${(Math.ceil(dollars * 100) / 100).toFixed(2)}`
    : undefined
}

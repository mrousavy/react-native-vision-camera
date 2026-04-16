export function normalizeHeadingTitle(value: string): string | null {
  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized.length > 0 ? normalized : null
}

export function normalizePlatformLabelWithLookup(
  value: string,
  canonicalLabels: ReadonlyMap<string, string>,
): string | null {
  const trimmed = value.trim().replace(/[.,;:!?]+$/g, '')
  if (trimmed.length === 0) {
    return null
  }

  return canonicalLabels.get(trimmed.toLowerCase()) ?? trimmed
}

export function orderPlatformLabelsWithOrder(
  labels: Iterable<string>,
  defaultOrder: readonly string[],
): string[] {
  const uniqueLabels = new Set<string>()
  for (const label of labels) {
    if (label.length > 0) {
      uniqueLabels.add(label)
    }
  }

  const prioritized = defaultOrder.filter((label) => uniqueLabels.has(label))
  const extras = [...uniqueLabels]
    .filter((label) => !defaultOrder.includes(label))
    .sort((left, right) =>
      left.localeCompare(right, undefined, { sensitivity: 'base' }),
    )

  return [...prioritized, ...extras]
}

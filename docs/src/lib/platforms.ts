import {
  normalizeHeadingTitle,
  normalizePlatformLabel,
} from '@/lib/shared/platforms.shared'

export type TocPlatformsByHeading = Record<string, string[]>
export { normalizeHeadingTitle, normalizePlatformLabel }

export type PageDataWithPlatforms = {
  platforms?: readonly string[]
}

export type PageDataWithTocPlatforms = {
  tocPlatforms?: Record<string, readonly string[]>
}

function normalizePlatformList(
  values: readonly string[] | undefined,
): string[] {
  if (values == null || values.length === 0) {
    return []
  }

  const seen = new Set<string>()
  const platforms: string[] = []

  for (const value of values) {
    const normalized = normalizePlatformLabel(value)
    if (normalized == null || seen.has(normalized)) {
      continue
    }

    seen.add(normalized)
    platforms.push(normalized)
  }

  return platforms
}

export function readPlatformsFromPageData(
  data: PageDataWithPlatforms | null | undefined,
): string[] {
  return normalizePlatformList(data?.platforms)
}

export function readSinglePlatformFromPageData(
  data: PageDataWithPlatforms | null | undefined,
): string | null {
  const platforms = readPlatformsFromPageData(data)
  if (platforms.length !== 1) {
    return null
  }

  return platforms[0] ?? null
}

export function readTocPlatformsByHeadingFromPageData(
  data: PageDataWithTocPlatforms | null | undefined,
): TocPlatformsByHeading {
  const tocPlatforms = data?.tocPlatforms
  if (tocPlatforms == null) {
    return {}
  }

  const result: TocPlatformsByHeading = {}
  for (const [heading, value] of Object.entries(tocPlatforms)) {
    const normalizedHeading = normalizeHeadingTitle(heading)
    if (normalizedHeading == null) {
      continue
    }

    const platforms = normalizePlatformList(value)
    if (platforms.length === 0) {
      continue
    }

    result[normalizedHeading] = platforms
  }

  return result
}

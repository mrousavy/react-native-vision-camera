import { getExternalCodeTypeLinks } from '@/lib/external-symbol-links'
import { apiSource } from '@/lib/source'

const CODE_LINK_SECTION_PRIORITY: Record<string, number> = {
  'hybrid-objects': 0,
  interfaces: 1,
  'type-aliases': 2,
  variables: 3,
  functions: 4,
}

const EXTERNAL_CODE_TYPE_LINKS = getExternalCodeTypeLinks()

type ScoredLink = {
  href: string
  score: number
}

function collectApiSymbolPages() {
  return apiSource
    .getPages()
    .map((apiPage) => {
      const [packageName, sectionName, symbolName] = apiPage.slugs
      if (
        typeof packageName !== 'string' ||
        typeof sectionName !== 'string' ||
        typeof symbolName !== 'string' ||
        !/^[A-Z][A-Za-z0-9_$]*$/.test(symbolName)
      ) {
        return null
      }

      return {
        packageName,
        sectionName,
        symbolName,
        href: `/api/${apiPage.slugs.join('/')}`,
      }
    })
    .filter((value): value is NonNullable<typeof value> => value != null)
}

function buildPackageCodeTypeLinks(): ReadonlyMap<
  string,
  Record<string, string>
> {
  const entries = collectApiSymbolPages()
  const packageNames = new Set(entries.map((entry) => entry.packageName))
  const linksByPackage = new Map<string, Record<string, string>>()

  for (const packageName of packageNames) {
    const scoredLinks = new Map<string, ScoredLink>()

    for (const entry of entries) {
      const sectionPriority =
        CODE_LINK_SECTION_PRIORITY[entry.sectionName] ?? Number.MAX_SAFE_INTEGER
      const packagePriority = entry.packageName === packageName ? 0 : 1
      const score = packagePriority * 1000 + sectionPriority

      const existing = scoredLinks.get(entry.symbolName)
      if (existing == null || score < existing.score) {
        scoredLinks.set(entry.symbolName, {
          href: entry.href,
          score,
        })
      }
    }

    for (const [symbolName, href] of Object.entries(EXTERNAL_CODE_TYPE_LINKS)) {
      if (!scoredLinks.has(symbolName)) {
        scoredLinks.set(symbolName, {
          href,
          score: Number.MAX_SAFE_INTEGER,
        })
      }
    }

    linksByPackage.set(
      packageName,
      Object.fromEntries(
        [...scoredLinks.entries()].map(([symbolName, value]) => [
          symbolName,
          value.href,
        ]),
      ),
    )
  }

  return linksByPackage
}

const PACKAGE_CODE_TYPE_LINKS = buildPackageCodeTypeLinks()

export function getApiCodeTypeLinks(
  packageName: string,
): Record<string, string> {
  return PACKAGE_CODE_TYPE_LINKS.get(packageName) ?? EXTERNAL_CODE_TYPE_LINKS
}

import { getLLMCorpus } from '@/lib/get-llm-corpus'
import { absoluteUrl, getMarkdownPath, siteConfig } from '@/lib/site-config'
import { apiSource, docsSource } from '@/lib/source'

type Scope = 'docs' | 'api'

type ScopedPage = {
  page: ReturnType<typeof docsSource.getPage> extends infer T
    ? Exclude<T, undefined>
    : never
  scope: Scope
}

function normalizeSlug(slug: string[] | undefined): string[] | undefined {
  return Array.isArray(slug) && slug.length > 0 ? slug : undefined
}

function formatIndexSection(scope: Scope): string {
  const pageSource = scope === 'api' ? apiSource : docsSource
  const title = scope === 'api' ? 'API Reference' : 'Guides'
  const entries = pageSource
    .getPages()
    .map((page) => {
      const pageTitle =
        typeof page.data.title === 'string' && page.data.title.length > 0
          ? page.data.title
          : page.url

      return `- ${pageTitle}: ${absoluteUrl(getMarkdownPath(page.url))}`
    })
    .join('\n')

  return `## ${title}\n\n${entries}`
}

export function resolveScopedPage(
  slug: string[] | undefined,
): ScopedPage | null {
  const normalized = normalizeSlug(slug)
  if (normalized == null) {
    return null
  }

  const [scope, ...rest] = normalized
  const scopedSlug = normalizeSlug(rest)

  if (scope === 'api') {
    const page = apiSource.getPage(scopedSlug)
    return page == null ? null : { page, scope: 'api' }
  }

  if (scope === 'docs') {
    const page = docsSource.getPage(scopedSlug)
    return page == null ? null : { page, scope: 'docs' }
  }

  return null
}

export async function getLLMIndex(): Promise<string> {
  return [
    `# ${siteConfig.name} documentation`,
    '',
    'Use the `.mdx` page endpoints for source-friendly markdown. Use `/llms-full.txt` for the full corpus.',
    '',
    formatIndexSection('docs'),
    '',
    formatIndexSection('api'),
  ].join('\n')
}

export { getLLMCorpus }

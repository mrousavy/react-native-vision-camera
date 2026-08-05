import type { Item, Node } from 'fumadocs-core/page-tree'
import { llms } from 'fumadocs-core/source'
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

function withMarkdownUrl(page: Item): Item {
  if (page.external === true) {
    return page
  }

  return {
    ...page,
    url: absoluteUrl(getMarkdownPath(page.url)),
  }
}

function withMarkdownUrls(node: Node): Node {
  if (node.type === 'page') {
    return withMarkdownUrl(node)
  }

  if (node.type === 'folder') {
    return {
      ...node,
      index: node.index == null ? undefined : withMarkdownUrl(node.index),
      children: node.children.map(withMarkdownUrls),
    }
  }

  return node
}

function formatIndexSection(scope: Scope): string {
  const pageSource = scope === 'api' ? apiSource : docsSource
  const generator = scope === 'api' ? llms(apiSource) : llms(docsSource)
  const title = scope === 'api' ? 'API Reference' : 'Guides'
  const nodes = pageSource.getPageTree().children
  const sectionNodes =
    nodes[0]?.type === 'separator' && nodes[0].name === title
      ? nodes.slice(1)
      : nodes
  const entries = sectionNodes
    .map((node) => generator.indexNode(withMarkdownUrls(node)).trim())
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
    'Use the `.md` page endpoints for source-friendly markdown. Use `/llms-full.txt` for the full corpus.',
    '',
    formatIndexSection('docs'),
    '',
    formatIndexSection('api'),
  ].join('\n')
}

export { getLLMCorpus }

import fs from 'node:fs'
import path from 'node:path'
import GithubSlugger from 'github-slugger'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import type { Node } from 'unist'
import { visit } from 'unist-util-visit'
import { resolveApiLocalHref } from '../src/lib/resolve-api-link.ts'
import { apiSource, docsSource } from '../src/lib/source.ts'

type PageLink = {
  href: string
  line: number
  column: number
}

type PageData = {
  collection: string
  url: string
  path: string
  locale: string | undefined
  fullPath: string
  title: string
  titleSlug: string | null
  anchors: Set<string>
  links: PageLink[]
}

type LinkFailure = PageLink & {
  fullPath: string
  reason: string
}

interface SourcePage {
  url: string
  path: string
  locale?: string | undefined
  data: {
    info: { fullPath: string }
    title?: string
  }
}

const docsRoot = path.resolve(process.cwd())
const siteOrigin = 'https://react-native-vision-camera.local'

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }

  return pathname
}

function decodeHash(hash: string): string {
  if (hash.length === 0) {
    return ''
  }

  try {
    return decodeURIComponent(hash)
  } catch {
    return hash
  }
}

function isExternalHref(href: string): boolean {
  return (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('data:') ||
    href.startsWith('javascript:')
  )
}

function extractText(node: Node | null | undefined): string {
  if (node == null || typeof node !== 'object') {
    return ''
  }

  if ('value' in node && typeof node.value === 'string') {
    return node.value
  }

  if (!('children' in node) || !Array.isArray(node.children)) {
    return ''
  }

  return node.children.map((child: Node) => extractText(child)).join('')
}

function readMdxTree(filePath: string): Node {
  const text = fs.readFileSync(filePath, 'utf8')
  return unified().use(remarkParse).use(remarkMdx).parse(text)
}

function toSlug(value: string): string {
  const slugger = new GithubSlugger()
  return slugger.slug(value)
}

function collectPageData(page: SourcePage): Omit<PageData, 'collection'> {
  const fullPath = path.join(docsRoot, page.data.info.fullPath)
  const tree = readMdxTree(fullPath)
  const anchors = new Set<string>()
  const links: PageLink[] = []
  const slugger = new GithubSlugger()
  const fileStem = path.basename(page.path, path.extname(page.path))
  const title =
    typeof page.data?.title === 'string' && page.data.title.length > 0
      ? page.data.title
      : fileStem

  visit(tree, (node) => {
    if (node.type === 'heading') {
      const title = extractText(node).trim()
      if (title.length > 0) {
        anchors.add(slugger.slug(title))
      }
    }

    if (node.type === 'link' && 'url' in node && typeof node.url === 'string') {
      links.push({
        href: node.url,
        line: node.position?.start.line ?? 1,
        column: node.position?.start.column ?? 1,
      })
    }

    if (
      (node.type === 'mdxJsxFlowElement' ||
        node.type === 'mdxJsxTextElement') &&
      'attributes' in node &&
      Array.isArray(node.attributes)
    ) {
      for (const attribute of node.attributes) {
        if (
          attribute == null ||
          typeof attribute !== 'object' ||
          !('type' in attribute) ||
          attribute.type !== 'mdxJsxAttribute'
        ) {
          continue
        }

        const name = 'name' in attribute ? attribute.name : undefined
        const value = 'value' in attribute ? attribute.value : undefined

        if (name === 'id' && typeof value === 'string') {
          anchors.add(value)
        }

        if (name === 'href' && typeof value === 'string') {
          links.push({
            href: value,
            line: node.position?.start.line ?? 1,
            column: node.position?.start.column ?? 1,
          })
        }
      }
    }
  })

  return {
    url: page.url,
    path: page.path,
    locale: page.locale,
    fullPath,
    title,
    titleSlug: title == null ? null : toSlug(title),
    anchors,
    links,
  }
}

function collectPages(collection: string, pages: SourcePage[]): PageData[] {
  return pages.map((page) => ({
    collection,
    ...collectPageData(page),
  }))
}

function validateResolvedTarget(
  pagesByUrl: Map<string, PageData>,
  fromPage: PageData,
  link: PageLink,
  pathname: string,
  hash: string,
): LinkFailure | null {
  const targetPage = pagesByUrl.get(pathname)
  if (targetPage == null) {
    return {
      ...link,
      fullPath: fromPage.fullPath,
      reason: `targets missing page ${pathname}`,
    }
  }

  if (
    hash.length > 0 &&
    targetPage.collection === 'api' &&
    targetPage.titleSlug === hash
  ) {
    return null
  }

  if (hash.length > 0 && !targetPage.anchors.has(hash)) {
    return {
      ...link,
      fullPath: fromPage.fullPath,
      reason: `targets missing anchor #${hash} on ${pathname}`,
    }
  }

  return null
}

function validateAbsoluteHref(
  pagesByUrl: Map<string, PageData>,
  fromPage: PageData,
  link: PageLink,
): LinkFailure | null {
  const url = new URL(link.href, siteOrigin)
  const pathname = normalizePathname(url.pathname)
  const hash = decodeHash(url.hash.replace(/^#/, ''))

  if (!pathname.startsWith('/docs') && !pathname.startsWith('/api')) {
    return null
  }

  return validateResolvedTarget(pagesByUrl, fromPage, link, pathname, hash)
}

function validateGuideRelativeHref(
  pagesByUrl: Map<string, PageData>,
  fromPage: PageData,
  link: PageLink,
): LinkFailure | null {
  const url = new URL(link.href, `${siteOrigin}${fromPage.url}`)
  const pathname = normalizePathname(url.pathname)
  const hash = decodeHash(url.hash.replace(/^#/, ''))

  if (!pathname.startsWith('/docs') && !pathname.startsWith('/api')) {
    return null
  }

  return validateResolvedTarget(pagesByUrl, fromPage, link, pathname, hash)
}

function validateApiRelativeHref(
  pagesByUrl: Map<string, PageData>,
  fromPage: PageData,
  link: PageLink,
): LinkFailure | null {
  const resolvedHref = resolveApiLocalHref({
    source: apiSource,
    href: link.href,
    pagePath: fromPage.path,
    locale: fromPage.locale,
  })

  if (resolvedHref == null) {
    return {
      ...link,
      fullPath: fromPage.fullPath,
      reason: 'does not resolve to an API page',
    }
  }

  const [pathnamePart, hashPart = ''] = resolvedHref.split('#', 2)
  const pathname = normalizePathname(pathnamePart)
  const hash = decodeHash(hashPart)
  return validateResolvedTarget(pagesByUrl, fromPage, link, pathname, hash)
}

function validateLink(
  pagesByUrl: Map<string, PageData>,
  page: PageData,
  link: PageLink,
): LinkFailure | null {
  const href = link.href.trim()
  if (href.length === 0 || isExternalHref(href)) {
    return null
  }

  if (href.startsWith('#')) {
    const hash = decodeHash(href.slice(1))
    if (
      hash.length === 0 ||
      page.anchors.has(hash) ||
      (page.collection === 'api' && page.titleSlug === hash)
    ) {
      return null
    }

    return {
      ...link,
      fullPath: page.fullPath,
      reason: `targets missing anchor #${hash} on ${page.url}`,
    }
  }

  if (href.startsWith('/')) {
    return validateAbsoluteHref(pagesByUrl, page, link)
  }

  if (page.collection === 'api') {
    return validateApiRelativeHref(pagesByUrl, page, link)
  }

  return validateGuideRelativeHref(pagesByUrl, page, link)
}

function main(): void {
  const docsPages = collectPages('docs', docsSource.getPages())
  const apiPages = collectPages('api', apiSource.getPages())
  const allPages = [...docsPages, ...apiPages]
  const pagesByUrl = new Map(allPages.map((page) => [page.url, page]))

  const failures = allPages.flatMap((page) =>
    page.links
      .map((link) => validateLink(pagesByUrl, page, link))
      .filter((failure): failure is LinkFailure => failure != null),
  )

  if (failures.length > 0) {
    console.error(
      `[verify-links] found ${failures.length} broken internal link${failures.length === 1 ? '' : 's'}:`,
    )
    for (const failure of failures) {
      console.error(
        `- ${path.relative(docsRoot, failure.fullPath)}:${failure.line}:${failure.column} ${failure.reason} (${failure.href})`,
      )
    }
    process.exit(1)
  }

  console.log(
    `[verify-links] checked ${allPages.length} pages and found no broken internal links.`,
  )
}

main()

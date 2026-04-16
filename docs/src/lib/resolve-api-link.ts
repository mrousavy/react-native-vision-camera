import * as path from 'node:path'

type SourceLike = {
  getPageByHref: (
    href: string,
    options: { dir: string; language?: string | undefined },
  ) => { page: { url: string }; hash?: string } | undefined
}

type ResolveApiLinkOptions = {
  source: SourceLike
  href: string
  pagePath: string
  locale?: string | undefined
}

function isExternalHref(href: string): boolean {
  return (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('data:') ||
    href.startsWith('tel:')
  )
}

export function isLocalHref(href: string): boolean {
  return href.length > 0 && !href.startsWith('#') && !isExternalHref(href)
}

function toSourceRelativeHref(href: string): string {
  if (href.startsWith('/')) {
    return href
  }

  if (href.startsWith('./')) {
    return href
  }

  return `./${href}`
}

function toResolvedHref(
  source: SourceLike,
  href: string,
  pagePath: string,
  locale?: string,
): string | null {
  const target = source.getPageByHref(toSourceRelativeHref(href), {
    dir: path.dirname(pagePath),
    language: locale,
  })

  if (target != null) {
    return target.hash ? `${target.page.url}#${target.hash}` : target.page.url
  }

  return null
}

export function resolveApiLocalHref({
  source,
  href,
  pagePath,
  locale,
}: ResolveApiLinkOptions): string | null {
  if (!isLocalHref(href)) {
    return null
  }
  return toResolvedHref(source, href, pagePath, locale)
}

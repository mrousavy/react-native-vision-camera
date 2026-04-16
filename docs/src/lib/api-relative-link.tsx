import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { ComponentProps } from 'react'
import { isLocalHref, resolveApiLocalHref } from '@/lib/resolve-api-link'

type LinkComponentProps = ComponentProps<'a'>

export function createApiRelativeLink(
  source: {
    getPageByHref: (
      href: string,
      options: { dir: string; language?: string | undefined },
    ) => { page: { url: string }; hash?: string } | undefined
  },
  page: { path: string; locale?: string | undefined },
  OverrideLink = defaultMdxComponents.a,
) {
  return function ApiRelativeLink({ href, ...props }: LinkComponentProps) {
    if (typeof href === 'string' && isLocalHref(href)) {
      const resolvedHref = resolveApiLocalHref({
        source,
        href,
        pagePath: page.path,
        locale: page.locale,
      })
      if (resolvedHref != null) {
        href = resolvedHref
      }
    }

    return <OverrideLink href={href} {...props} />
  }
}

import defaultMdxComponents from 'fumadocs-ui/mdx'
import {
  Children,
  type ComponentProps,
  cloneElement,
  isValidElement,
  type ReactNode,
} from 'react'
import type { CodeTypeLinks, LinkRenderer } from '@/lib/mdx/types'
import { mergeClassNames } from '@/lib/mdx/utils'

function toCodeLinkTitle(typeName: string): string {
  return `Open ${typeName} docs`
}

function renderCodeLink(
  LinkComponent: LinkRenderer,
  {
    key,
    className,
    children,
    ...props
  }: ComponentProps<'a'> & { key?: string },
): ReactNode {
  return (
    <LinkComponent
      key={key}
      className={mergeClassNames('api-code-link', className)}
      {...props}
    >
      {children}
    </LinkComponent>
  )
}

function convertCodeAnchorElement(
  anchor: ReactNode,
  LinkComponent: LinkRenderer,
): ReactNode {
  if (!isValidElement<ComponentProps<'a'>>(anchor) || anchor.type !== 'a') {
    return anchor
  }

  const { className, children, ...props } = anchor.props

  return renderCodeLink(LinkComponent, {
    ...props,
    key: anchor.key == null ? undefined : String(anchor.key),
    className,
    children,
  })
}

function linkifyCodeTextNode(
  text: string,
  codeTypeLinks: CodeTypeLinks,
  currentTypeName?: string,
  LinkComponent: LinkRenderer = defaultMdxComponents.a,
): ReactNode {
  if (text.length === 0) {
    return text
  }

  const identifierRegex = /\b[A-Z][A-Za-z0-9_$]*\b/g
  const parts: ReactNode[] = []
  let cursor = 0

  for (const match of text.matchAll(identifierRegex)) {
    const identifier = match[0]
    const start = match.index ?? 0
    const end = start + identifier.length

    if (start > cursor) {
      parts.push(text.slice(cursor, start))
    }

    if (identifier === currentTypeName) {
      parts.push(identifier)
      cursor = end
      continue
    }

    const href = codeTypeLinks[identifier]
    if (typeof href === 'string' && href.length > 0) {
      parts.push(
        renderCodeLink(LinkComponent, {
          key: `${identifier}-${start}`,
          href,
          title: toCodeLinkTitle(identifier),
          children: identifier,
        }),
      )
    } else {
      parts.push(identifier)
    }

    cursor = end
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor))
  }

  if (parts.length === 0) {
    return text
  }

  if (parts.length === 1) {
    return parts[0]
  }

  return <>{parts}</>
}

function linkifyCodeElement(
  codeElement: ReactNode,
  codeTypeLinks: CodeTypeLinks,
  currentTypeName?: string,
  LinkComponent: LinkRenderer = defaultMdxComponents.a,
): ReactNode {
  if (
    !isValidElement<{ children?: ReactNode }>(codeElement) ||
    codeElement.type !== 'code'
  ) {
    return codeElement
  }

  const linkedCodeChildren = Children.map(
    codeElement.props.children,
    (line) => {
      if (typeof line === 'string') {
        return linkifyCodeTextNode(
          line,
          codeTypeLinks,
          currentTypeName,
          LinkComponent,
        )
      }

      if (!isValidElement<{ children?: ReactNode }>(line)) {
        return line
      }

      if (line.type === 'a') {
        return convertCodeAnchorElement(line, LinkComponent)
      }

      if (line.type !== 'span') {
        return line
      }

      const linkedLineChildren = Children.map(line.props.children, (token) => {
        if (typeof token === 'string') {
          return linkifyCodeTextNode(
            token,
            codeTypeLinks,
            currentTypeName,
            LinkComponent,
          )
        }

        if (!isValidElement<{ children?: ReactNode }>(token)) {
          return token
        }

        if (token.type === 'a') {
          return convertCodeAnchorElement(token, LinkComponent)
        }

        if (token.type !== 'span') {
          return token
        }

        if (typeof token.props.children !== 'string') {
          return token
        }

        const linkedTokenText = linkifyCodeTextNode(
          token.props.children,
          codeTypeLinks,
          currentTypeName,
          LinkComponent,
        )
        if (linkedTokenText === token.props.children) {
          return token
        }

        return cloneElement(token, undefined, linkedTokenText)
      })

      return cloneElement(line, undefined, linkedLineChildren)
    },
  )

  return cloneElement(codeElement, undefined, linkedCodeChildren)
}

export function linkifyCodeBlockChildren(
  children: ReactNode,
  codeTypeLinks: CodeTypeLinks,
  currentTypeName?: string,
  LinkComponent: LinkRenderer = defaultMdxComponents.a,
): ReactNode {
  return Children.map(children, (child) =>
    linkifyCodeElement(child, codeTypeLinks, currentTypeName, LinkComponent),
  )
}

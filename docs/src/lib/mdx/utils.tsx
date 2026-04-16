import { isValidElement, type ReactNode } from 'react'

export function mergeClassNames(
  ...classNames: Array<string | undefined>
): string {
  return classNames.filter(Boolean).join(' ')
}

export function extractTextFromNode(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') {
    return ''
  }

  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }

  if (Array.isArray(node)) {
    return node.map((child) => extractTextFromNode(child)).join('')
  }

  if (!isValidElement<{ children?: ReactNode }>(node)) {
    return ''
  }

  return extractTextFromNode(node.props.children)
}

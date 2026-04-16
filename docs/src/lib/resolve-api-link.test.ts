import { describe, expect, test } from 'bun:test'
import { isLocalHref, resolveApiLocalHref } from '@/lib/resolve-api-link'

describe('resolveApiLocalHref', () => {
  test('treats document-relative paths as local', () => {
    expect(isLocalHref('./Frame.mdx')).toBe(true)
    expect(isLocalHref('../Frame.mdx')).toBe(true)
    expect(isLocalHref('#section')).toBe(false)
    expect(isLocalHref('https://example.com')).toBe(false)
  })

  test('resolves relative api links against the current page directory', () => {
    const calls: Array<{ href: string; dir: string; language?: string }> = []
    const href = resolveApiLocalHref({
      source: {
        getPageByHref(candidate, options) {
          calls.push({
            href: candidate,
            dir: options.dir,
            language: options.language,
          })

          return {
            page: {
              url: '/api/react-native-vision-camera/hybrid-objects/Frame',
            },
            hash: 'orientation',
          }
        },
      },
      href: 'Frame.mdx',
      pagePath: 'react-native-vision-camera/functions/useCamera.mdx',
      locale: 'en',
    })

    expect(calls).toEqual([
      {
        href: './Frame.mdx',
        dir: 'react-native-vision-camera/functions',
        language: 'en',
      },
    ])
    expect(href).toBe(
      '/api/react-native-vision-camera/hybrid-objects/Frame#orientation',
    )
  })

  test('returns null for external links', () => {
    expect(
      resolveApiLocalHref({
        source: {
          getPageByHref() {
            throw new Error('should not resolve external links')
          },
        },
        href: 'mailto:hello@example.com',
        pagePath: 'react-native-vision-camera/functions/useCamera.mdx',
      }),
    ).toBeNull()
  })
})

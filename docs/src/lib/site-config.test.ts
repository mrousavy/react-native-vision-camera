import { describe, expect, test } from 'bun:test'
import { getMarkdownPath } from '@/lib/site-config'

describe('getMarkdownPath', () => {
  test('uses the interoperable .md suffix', () => {
    expect(getMarkdownPath('/docs/zooming')).toBe('/docs/zooming.md')
    expect(getMarkdownPath('/api')).toBe('/api.md')
  })
})

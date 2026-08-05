import { describe, expect, test } from 'bun:test'
import { createMarkdownResponse } from '@/lib/llms-response'

describe('createMarkdownResponse', () => {
  test('identifies Markdown content, cache variance, and its canonical HTML page', async () => {
    const response = createMarkdownResponse('# Zooming', '/docs/zooming')

    expect(response.headers.get('Content-Type')).toBe(
      'text/markdown; charset=utf-8',
    )
    expect(response.headers.get('Vary')).toBe('Accept')
    expect(response.headers.get('Link')).toBe(
      '<https://visioncamera.margelo.com/docs/zooming>; rel="canonical"',
    )
    expect(await response.text()).toBe('# Zooming')
  })
})

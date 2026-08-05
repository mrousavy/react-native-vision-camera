import { describe, expect, test } from 'bun:test'
import { getLLMIndex } from '@/lib/llms'
import { absoluteUrl, getMarkdownPath } from '@/lib/site-config'

describe('getLLMIndex', () => {
  test('composes the Fumadocs page trees with Markdown page URLs', async () => {
    const index = await getLLMIndex()

    expect(index).toStartWith('# VisionCamera documentation')
    expect(index).toContain('## Guides')
    expect(index).not.toContain('- **Guides**')
    expect(index).toContain('- **Topics**')
    expect(index).toContain(
      `- [Zooming](${absoluteUrl(getMarkdownPath('/docs/zooming'))})`,
    )
    expect(index).toContain('## API Reference')
    expect(index).toContain(
      `[CameraSession](${absoluteUrl(getMarkdownPath('/api/react-native-vision-camera/hybrid-objects/CameraSession'))})`,
    )
    expect(index).not.toContain('VisionCamera guide covering')
  })
})

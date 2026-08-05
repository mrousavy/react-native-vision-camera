import { absoluteUrl } from '@/lib/site-config'

export function createMarkdownResponse(
  content: string,
  canonicalPath: string,
): Response {
  return new Response(content, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      Link: `<${absoluteUrl(canonicalPath)}>; rel="canonical"`,
      Vary: 'Accept',
    },
  })
}

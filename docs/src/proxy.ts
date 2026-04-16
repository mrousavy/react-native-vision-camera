import { isMarkdownPreferred, rewritePath } from 'fumadocs-core/negotiation'
import { type NextRequest, NextResponse } from 'next/server'

const { rewrite: rewriteDocsRoot } = rewritePath('/docs', '/llms.mdx/docs')
const { rewrite: rewriteDocsMarkdown } = rewritePath(
  '/docs/*path',
  '/llms.mdx/docs/*path',
)
const { rewrite: rewriteApiRoot } = rewritePath('/api', '/llms.mdx/api')
const { rewrite: rewriteApiMarkdown } = rewritePath(
  '/api/*path',
  '/llms.mdx/api/*path',
)

export const config = {
  matcher: ['/docs', '/docs/:path*', '/api', '/api/:path*'],
}

export default function proxy(request: NextRequest) {
  if (!isMarkdownPreferred(request)) {
    return NextResponse.next()
  }

  const pathname = request.nextUrl.pathname
  const result = [
    rewriteDocsRoot(pathname),
    rewriteDocsMarkdown(pathname),
    rewriteApiRoot(pathname),
    rewriteApiMarkdown(pathname),
  ].find((value): value is string => typeof value === 'string')

  return result == null
    ? NextResponse.next()
    : NextResponse.rewrite(new URL(result, request.nextUrl))
}

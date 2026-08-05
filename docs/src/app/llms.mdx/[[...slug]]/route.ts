import { notFound } from 'next/navigation'
import { getLLMText } from '@/lib/get-llm-text'
import { getLLMIndex, resolveScopedPage } from '@/lib/llms'
import { createMarkdownResponse } from '@/lib/llms-response'
import { apiSource, docsSource } from '@/lib/source'

export const revalidate = false

export async function GET(
  _req: Request,
  { params }: RouteContext<'/llms.mdx/[[...slug]]'>,
) {
  const { slug } = await params
  if (!Array.isArray(slug) || slug.length === 0) {
    return createMarkdownResponse(await getLLMIndex(), '/llms.txt')
  }

  const resolved = resolveScopedPage(slug)
  if (resolved == null) notFound()

  return createMarkdownResponse(
    await getLLMText(resolved.page, resolved.scope),
    resolved.page.url,
  )
}

export function generateStaticParams() {
  return [
    ...docsSource.generateParams().map((param) => ({
      slug: ['docs', ...(param.slug ?? [])],
    })),
    ...apiSource.generateParams().map((param) => ({
      slug: ['api', ...(param.slug ?? [])],
    })),
  ]
}

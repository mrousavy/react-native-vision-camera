import { notFound } from 'next/navigation'
import { getLLMText } from '@/lib/get-llm-text'
import { getLLMIndex, resolveScopedPage } from '@/lib/llms'
import { apiSource, docsSource } from '@/lib/source'

export const revalidate = false

export async function GET(
  _req: Request,
  { params }: RouteContext<'/llms.mdx/[[...slug]]'>,
) {
  const { slug } = await params
  if (!Array.isArray(slug) || slug.length === 0) {
    return new Response(await getLLMIndex(), {
      headers: {
        'Content-Type': 'text/markdown',
      },
    })
  }

  const resolved = resolveScopedPage(slug)
  if (resolved == null) notFound()

  return new Response(await getLLMText(resolved.page, resolved.scope), {
    headers: {
      'Content-Type': 'text/markdown',
    },
  })
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

import { apiReferenceSource } from '@/lib/source'
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page'
import { notFound } from 'next/navigation'
import { getMDXComponents } from '@/mdx-components'
import type { Metadata } from 'next'
import { createRelativeLink } from 'fumadocs-ui/mdx'

export default async function Page(props: PageProps<'/api-reference/[[...slug]]'>) {
  const params = await props.params
  const page = apiReferenceSource.getPage(params.slug)
  if (!page) notFound()

  const MDX = page.data.body

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className='mb-2'>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(apiReferenceSource, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  )
}

export async function generateStaticParams() {
  return apiReferenceSource.generateParams()
}

export async function generateMetadata(props: PageProps<'/api-reference/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params
  const page = apiReferenceSource.getPage(params.slug)
  if (!page) notFound()

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      url: `/api-reference/${page.slugs.join('/')}`,
    },
  }
}


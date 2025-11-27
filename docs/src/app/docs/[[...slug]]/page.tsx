import { getPageImage, source } from '@/lib/source'
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page'
import { notFound } from 'next/navigation'
import { getMDXComponents } from '@/mdx-components'
import type { Metadata } from 'next'
import { createRelativeLink } from 'fumadocs-ui/mdx'
import { LLMCopyButton, ViewOptions } from '@/components/page-actions'

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  const MDX = page.data.body

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className='mb-2'>{page.data.description}</DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <LLMCopyButton markdownUrl={`${page.url}.mdx`} />
        <ViewOptions
          markdownUrl={`${page.url}.mdx`}
          githubUrl={`https://github.com/mrousavy/react-native-vision-camera/blob/dev/content/docs/${page.path}`}
        />
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  )
}

export async function generateStaticParams() {
  return source.generateParams()
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

    const image = {
      url: getPageImage(page).url,
      width: 1200,
      height: 630,
    };

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      url: `/docs/${page.slugs.join('/')}`,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      images: [image],
    },
  }
}

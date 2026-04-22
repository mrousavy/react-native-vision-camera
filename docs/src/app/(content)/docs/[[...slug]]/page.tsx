import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/layouts/docs/page'
import { createRelativeLink } from 'fumadocs-ui/mdx'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LetsTalkWidget } from '@/components/lets-talk-widget'
import { LLMCopyButton, ViewOptions } from '@/components/page-actions'
import { PlatformPills } from '@/components/platform/pills'
import { readPlatformsFromPageData } from '@/lib/platforms'
import {
  getGithubContentUrl,
  getMarkdownPath,
  getOgImage,
} from '@/lib/site-config'
import { docsSource } from '@/lib/source'
import { getMDXComponents } from '@/mdx-components'

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params
  const page = docsSource.getPage(params.slug)
  if (!page) notFound()

  const MDX = page.data.body
  const platforms = readPlatformsFromPageData(page.data)
  const markdownUrl = getMarkdownPath(page.url)
  const githubUrl = getGithubContentUrl('docs', page.path)

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      tableOfContent={{ footer: <LetsTalkWidget /> }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <PlatformPills platforms={platforms} />
      <DocsDescription className="mb-2">
        {page.data.description}
      </DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <LLMCopyButton markdownUrl={markdownUrl} />
        <ViewOptions markdownUrl={markdownUrl} githubUrl={githubUrl} />
      </div>
      <DocsBody className="[&>*:first-child]:mt-0.5 prose-lg prose-h3:text-2xl prose-h3:leading-tight">
        <MDX
          components={getMDXComponents(
            {
              // this allows you to link to other pages with relative file paths
              a: createRelativeLink(docsSource, page),
            },
            {
              codeBlock: {
                viewportClassName: 'text-sm',
              },
            },
          )}
        />
      </DocsBody>
    </DocsPage>
  )
}

export async function generateStaticParams() {
  return docsSource.generateParams()
}

export async function generateMetadata(
  props: PageProps<'/docs/[[...slug]]'>,
): Promise<Metadata> {
  const params = await props.params
  const page = docsSource.getPage(params.slug)
  if (!page) notFound()

  const image = getOgImage(page.url)

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: {
      canonical: page.url,
    },
    openGraph: {
      url: page.url,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      images: [image],
    },
  }
}

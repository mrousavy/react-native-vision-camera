import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/site-config'
import { apiSource, docsSource } from '@/lib/source'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const docsPages = docsSource.getPages().map((page) => ({
    url: absoluteUrl(page.url),
    changeFrequency: 'weekly' as const,
    priority: page.url === '/docs' ? 0.9 : 0.7,
  }))

  const apiPages = apiSource.getPages().map((page) => ({
    url: absoluteUrl(page.url),
    changeFrequency: 'weekly' as const,
    priority: page.url === '/api' ? 0.8 : 0.6,
  }))

  return [
    {
      url: absoluteUrl('/'),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    ...docsPages,
    ...apiPages,
  ]
}

import { createSearchAPI } from 'fumadocs-core/search/server'
import type { InferPageType } from 'fumadocs-core/source'
import { apiSource, docsSource } from '@/lib/source'

type AnyPage =
  | InferPageType<typeof docsSource>
  | InferPageType<typeof apiSource>

function buildIndex(page: AnyPage) {
  return {
    id: page.url,
    title: page.data.title ?? page.url,
    description: page.data.description,
    url: page.url,
    structuredData: page.data.structuredData,
  }
}

export const { GET } = createSearchAPI('advanced', {
  // https://docs.orama.com/docs/orama-js/supported-languages
  language: 'english',
  indexes: () => [
    ...docsSource.getPages().map(buildIndex),
    ...apiSource.getPages().map(buildIndex),
  ],
  // Require every query token to match, with Levenshtein-1 typo tolerance.
  // Without threshold: 0, "camera devices" ranks pages that only mention "camera".
  search: { threshold: 0, tolerance: 1 },
})

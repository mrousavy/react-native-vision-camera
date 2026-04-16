import { createFromSource } from 'fumadocs-core/search/server'
import { docsSource } from '@/lib/source'

export const { GET } = createFromSource(docsSource, {
  // https://docs.orama.com/docs/orama-js/supported-languages
  language: 'english',
})

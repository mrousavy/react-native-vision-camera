import { loader } from 'fumadocs-core/source'
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons'
import { createApiReferenceTreePlugin } from '@/lib/source/api-reference-tree-plugin'
import { createPlatformLabelPlugin } from '@/lib/source/platform-label-plugin'
import { apiReference, docs } from '../../.source/server'

export const docsSource = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  plugins: ({ typedPlugin }) => [
    lucideIconsPlugin(),
    typedPlugin(createPlatformLabelPlugin()),
  ],
})

export const apiSource = loader({
  baseUrl: '/api',
  source: apiReference.toFumadocsSource(),
  plugins: ({ typedPlugin }) => [
    lucideIconsPlugin(),
    typedPlugin(createApiReferenceTreePlugin()),
    typedPlugin(createPlatformLabelPlugin()),
  ],
})

import { getLLMText } from '@/lib/get-llm-text'
import { apiSource, docsSource } from '@/lib/source'

const SECTION_SEPARATOR = '\n\n---\n\n'

export async function getLLMCorpus() {
  const guidePages = docsSource.getPages()
  const apiPages = apiSource.getPages()

  const scanned = await Promise.all([
    ...guidePages.map((page) => getLLMText(page, 'docs')),
    ...apiPages.map((page) => getLLMText(page, 'api')),
  ])

  return scanned.join(SECTION_SEPARATOR)
}

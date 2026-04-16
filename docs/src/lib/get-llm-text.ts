import { absoluteUrl } from '@/lib/site-config'

type LLMReadablePage = {
  url: string
  data: {
    title?: string
    getText(format: 'processed' | 'raw'): Promise<string>
  }
}

export async function getLLMText(page: LLMReadablePage, scope: 'docs' | 'api') {
  let text = ''
  try {
    text = await page.data.getText('processed')
  } catch {
    text = await page.data.getText('raw')
  }
  const scopeTitle = scope === 'api' ? 'API Reference' : 'Guides'
  const title =
    typeof page.data.title === 'string' && page.data.title.length > 0
      ? page.data.title
      : (page.url
          .split('/')
          .filter((segment) => segment.length > 0)
          .at(-1) ?? 'Page')

  return `# ${title}

Source: ${scopeTitle}
URL: ${absoluteUrl(page.url)}

${text}`
}

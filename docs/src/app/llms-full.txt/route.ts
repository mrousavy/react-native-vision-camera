import { getLLMCorpus } from '@/lib/llms'

export const revalidate = false

export async function GET() {
  const corpus = await getLLMCorpus()

  return new Response(corpus, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}

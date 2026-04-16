import { getLLMIndex } from '@/lib/llms'

// cached forever
export const revalidate = false

export async function GET() {
  const corpus = await getLLMIndex()

  return new Response(corpus, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}

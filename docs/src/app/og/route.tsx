import { renderOpenGraphImage } from '@/lib/docs-og-image'

export const revalidate = false

export async function GET() {
  return renderOpenGraphImage()
}

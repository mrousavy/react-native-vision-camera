import { renderOpenGraphImage } from '@/lib/docs-og-image'

export const revalidate = false

export async function GET(
  _req: Request,
  { params }: RouteContext<'/og/[...slug]'>,
) {
  const { slug } = await params
  return renderOpenGraphImage(slug)
}

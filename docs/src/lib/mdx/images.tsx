import { ImageZoom } from 'fumadocs-ui/components/image-zoom'
import type { ReactNode } from 'react'
import type {
  ImportedMdxImageSource,
  MdxImageProps,
  ResolvedImageSrc,
  StaticImageLike,
} from '@/lib/mdx/types'

function isStaticImageLike(value: ResolvedImageSrc): value is StaticImageLike {
  return (
    typeof value === 'object' &&
    value != null &&
    'src' in value &&
    'width' in value &&
    'height' in value &&
    typeof value.src === 'string' &&
    typeof value.width === 'number' &&
    typeof value.height === 'number'
  )
}

function isImportedMdxImageSource(
  value: MdxImageProps['src'],
): value is ImportedMdxImageSource {
  return typeof value === 'object' && value != null && 'default' in value
}

function resolveImageSrc(src: MdxImageProps['src']): ResolvedImageSrc | null {
  if (typeof src === 'string') {
    const trimmed = src.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  if (src == null) {
    return null
  }

  if (src instanceof URL) {
    return src.toString()
  }

  if (src instanceof Blob) {
    return null
  }

  if (isImportedMdxImageSource(src)) {
    return resolveImageSrc(src.default)
  }

  if (isStaticImageLike(src)) {
    return src
  }

  return null
}

export function MdxImage(props: MdxImageProps): ReactNode {
  const { src, ...rest } = props
  const normalizedSrc = resolveImageSrc(src)
  if (normalizedSrc == null) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Ignoring unsupported MDX image source.', src)
    }
    return null
  }

  return <ImageZoom {...rest} src={normalizedSrc} />
}

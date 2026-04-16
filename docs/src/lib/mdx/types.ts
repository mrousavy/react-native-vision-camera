import type { ImageZoomProps } from 'fumadocs-ui/components/image-zoom'
import type { ComponentProps, CSSProperties, FunctionComponent } from 'react'
import type { TocPlatformsByHeading } from '@/lib/platforms'

export type CodeTypeLinks = Record<string, string>

export type CodeBlockDisplayOptions = {
  className?: string
  preClassName?: string
  viewportClassName?: string
}

export type LinkRenderer = FunctionComponent<ComponentProps<'a'>> | 'a'

export type MdxComponentOptions = {
  codeTypeLinks?: CodeTypeLinks
  currentTypeName?: string
  codeBlock?: CodeBlockDisplayOptions
  headingPlatforms?: TocPlatformsByHeading
}

export type CalloutStyle = CSSProperties & {
  '--callout-color'?: string
}

export type StaticImageLike = {
  src: string
  width: number
  height: number
  blurDataURL?: string
  blurWidth?: number
  blurHeight?: number
}

export type HeadingRenderer =
  | FunctionComponent<ComponentProps<'h3'>>
  | 'h3'
  | 'h4'
  | 'h5'

export type ResolvedImageSrc = NonNullable<ImageZoomProps['src']>

export type ImportedMdxImageSource = {
  default: ResolvedImageSrc
}

export type MdxImageSource =
  | ComponentProps<'img'>['src']
  | ResolvedImageSrc
  | ImportedMdxImageSource
  | URL

export type MdxImageProps = Omit<ComponentProps<'img'>, 'src'> & {
  src?: MdxImageSource
}

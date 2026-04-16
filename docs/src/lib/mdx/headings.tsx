import type { ComponentProps, ReactNode } from 'react'
import type { HeadingRenderer } from '@/lib/mdx/types'
import { extractTextFromNode } from '@/lib/mdx/utils'
import {
  normalizeHeadingTitle,
  type TocPlatformsByHeading,
} from '@/lib/platforms'

export function withHeadingPlatformPills(
  Heading: HeadingRenderer,
  headingPlatforms: TocPlatformsByHeading,
): HeadingRenderer {
  if (Object.keys(headingPlatforms).length === 0) {
    return Heading
  }

  return function HeadingWithPlatformPills(
    props: ComponentProps<'h3'>,
  ): ReactNode {
    const title = normalizeHeadingTitle(extractTextFromNode(props.children))
    const platforms = title == null ? [] : (headingPlatforms[title] ?? [])

    if (platforms.length === 0) {
      return <Heading {...props} />
    }

    return (
      <>
        <Heading {...props} />
        <div className="api-member-platform-pill-row">
          {platforms.map((platform) => (
            <span key={platform} className="api-member-platform-pill">
              {platform}
            </span>
          ))}
        </div>
      </>
    )
  }
}

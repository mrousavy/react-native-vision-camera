import { createGenerator } from 'fumadocs-typescript'
import { AutoTypeTable } from 'fumadocs-typescript/ui'
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion'
import { CalloutDescription } from 'fumadocs-ui/components/callout'
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock'
import * as FilesComponents from 'fumadocs-ui/components/files'
import * as TabsComponents from 'fumadocs-ui/components/tabs'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { MDXComponents } from 'mdx/types'
import type { ComponentProps } from 'react'
import { MdxCalloutContainer, MdxCalloutTitle } from '@/lib/mdx/callouts'
import { linkifyCodeBlockChildren } from '@/lib/mdx/code-links'
import { withHeadingPlatformPills } from '@/lib/mdx/headings'
import { MdxImage } from '@/lib/mdx/images'
import type {
  HeadingRenderer,
  LinkRenderer,
  MdxComponentOptions,
} from '@/lib/mdx/types'
import { mergeClassNames } from '@/lib/mdx/utils'

const generator = createGenerator()

type CodeBlockRendererProps = ComponentProps<'pre'> &
  Partial<ComponentProps<typeof CodeBlock>>

function resolveLinkRenderer(component: MDXComponents['a']): LinkRenderer {
  if (component == null) {
    return defaultMdxComponents.a
  }

  return typeof component === 'string' ? 'a' : component
}

function resolveHeadingRenderer(
  component: MDXComponents['h3'] | MDXComponents['h4'] | MDXComponents['h5'],
  fallback: HeadingRenderer,
): HeadingRenderer {
  if (component == null) {
    return fallback
  }

  return typeof component === 'string' ? fallback : component
}

export function getMDXComponents(
  components?: MDXComponents,
  options?: MdxComponentOptions,
): MDXComponents {
  const codeTypeLinks = options?.codeTypeLinks ?? {}
  const currentTypeName = options?.currentTypeName
  const codeBlock = options?.codeBlock
  const headingPlatforms = options?.headingPlatforms ?? {}
  const mergedComponents = {
    ...defaultMdxComponents,
    ...TabsComponents,
    ...FilesComponents,
    ...components,
  } satisfies MDXComponents
  const LinkComponent = resolveLinkRenderer(mergedComponents.a)
  const h3 = withHeadingPlatformPills(
    resolveHeadingRenderer(mergedComponents.h3, defaultMdxComponents.h3),
    headingPlatforms,
  )
  const h4 = withHeadingPlatformPills(
    resolveHeadingRenderer(mergedComponents.h4, defaultMdxComponents.h4),
    headingPlatforms,
  )
  const h5 = withHeadingPlatformPills(
    resolveHeadingRenderer(mergedComponents.h5, defaultMdxComponents.h5),
    headingPlatforms,
  )

  return {
    ...mergedComponents,
    pre: ({
      children,
      className,
      viewportProps,
      ...props
    }: CodeBlockRendererProps) => {
      const linkedChildren =
        Object.keys(codeTypeLinks).length > 0
          ? linkifyCodeBlockChildren(
              children,
              codeTypeLinks,
              currentTypeName,
              LinkComponent,
            )
          : children

      return (
        <CodeBlock
          {...props}
          className={mergeClassNames(className, codeBlock?.className)}
          viewportProps={{
            ...viewportProps,
            className: mergeClassNames(
              viewportProps?.className,
              codeBlock?.viewportClassName,
            ),
          }}
        >
          <Pre className={codeBlock?.preClassName}>{linkedChildren}</Pre>
        </CodeBlock>
      )
    },
    Accordion,
    Accordions,
    'callout-root': MdxCalloutContainer,
    'callout-title': MdxCalloutTitle,
    'callout-body': CalloutDescription,
    AutoTypeTable: (props) => (
      <AutoTypeTable {...props} generator={generator} />
    ),
    img: MdxImage,
    h3,
    h4,
    h5,
  } satisfies MDXComponents
}

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>
}

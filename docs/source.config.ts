import { defineConfig, defineDocs, frontmatterSchema, metaSchema } from 'fumadocs-mdx/config'
import { remarkNpm } from 'fumadocs-core/mdx-plugins'
import remarkCallout from '@r4ai/remark-callout'

// You can customise Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: frontmatterSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
})

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [
      remarkNpm,
      [
        remarkCallout,
        {
          root: (callout: any) => {
            return {
              tagName: 'callout-root',
              properties: {
                type: callout.type.toLowerCase() === 'important' ? 'info' : callout.type.toLowerCase(),
              },
            }
          },
          title: (callout: any) => ({
            tagName: 'callout-title',
            properties: {
              type: callout.type.toLowerCase() === 'important' ? 'info' : callout.type.toLowerCase(),
            },
          }),
          body: (callout: any) => ({
            tagName: 'callout-body',
            properties: {},
          }),
        },
      ],
    ],
  },
})

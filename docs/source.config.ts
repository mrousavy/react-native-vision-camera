import type {
  Callout,
  NodeOptions,
  Options as RemarkCalloutOptions,
} from '@r4ai/remark-callout'
import remarkCallout from '@r4ai/remark-callout'
import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
  metaSchema,
} from 'fumadocs-mdx/config'
import type { Root } from 'mdast'
import type { MdxJsxAttribute, MdxJsxFlowElement } from 'mdast-util-mdx-jsx'
import { visit } from 'unist-util-visit'
import type { VFile } from 'vfile'
import { z } from 'zod'

declare module 'vfile' {
  interface DataMap {
    elementIds?: string[]
  }
}

const docsFrontmatterSchema = frontmatterSchema.extend({
  platforms: z.array(z.string().min(1)).optional(),
})

const apiReferenceFrontmatterSchema = docsFrontmatterSchema.extend({
  hybridParent: z.string().min(1).optional(),
  tocPlatforms: z.record(z.string(), z.array(z.string().min(1))).optional(),
})

function normalizeCalloutType(callout: Callout): string {
  const type = callout.type.toLowerCase()
  return type === 'important' ? 'info' : type
}

function createCalloutNode(tagName: string, callout: Callout): NodeOptions {
  return {
    tagName,
    properties: {
      type: normalizeCalloutType(callout),
    },
  }
}

const remarkCalloutOptions: RemarkCalloutOptions = {
  root: (callout) => createCalloutNode('callout-root', callout),
  title: (callout) => createCalloutNode('callout-title', callout),
  body: () => ({
    tagName: 'callout-body',
    properties: {},
  }),
}

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: docsFrontmatterSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
})

export const apiReference = defineDocs({
  dir: 'content/api',
  docs: {
    schema: apiReferenceFrontmatterSchema,
  },
  meta: {
    schema: metaSchema,
  },
})

export default defineConfig({
  mdxOptions: {
    valueToExport: ['elementIds'],
    remarkNpmOptions: {
      persist: {
        id: 'package-manager',
      },
    },
    remarkHeadingOptions: {
      generateToc: true,
    },
    remarkPlugins: [
      function remarkElementIds() {
        return (tree: Root, file: VFile) => {
          const elementIds = file.data.elementIds ?? []
          file.data.elementIds = elementIds

          visit(tree, 'mdxJsxFlowElement', (element: MdxJsxFlowElement) => {
            if (!element.name || !element.attributes) {
              return
            }

            const idAttr = element.attributes.find(
              (attr): attr is MdxJsxAttribute =>
                attr.type === 'mdxJsxAttribute' && attr.name === 'id',
            )

            if (idAttr && typeof idAttr.value === 'string') {
              elementIds.push(idAttr.value)
            }
          })
        }
      },
      [remarkCallout, remarkCalloutOptions],
    ],
  },
})

import type {
  Item as PageTreeItem,
  Node as PageTreeNode,
  Root as PageTreeRoot,
} from 'fumadocs-core/page-tree'
import type {
  LoaderConfig,
  LoaderPlugin,
  PageTreeBuilderContext,
  SourceConfig,
} from 'fumadocs-core/source'
import { createElement } from 'react'
import {
  type PageDataWithPlatforms,
  readSinglePlatformFromPageData,
} from '@/lib/platforms'
import { readPageData } from '@/lib/source/page-tree'

type PlatformSourceConfig = SourceConfig & {
  pageData: PageDataWithPlatforms
}
type PlatformLoaderConfig = LoaderConfig & {
  source: PlatformSourceConfig
}

const SIDEBAR_ITEM_CONTENT_CLASS = 'api-sidebar-item-content'
const SIDEBAR_ITEM_LABEL_CLASS = 'api-sidebar-item-label'
const SIDEBAR_PLATFORM_PILL_CLASS = 'api-sidebar-platform-pill'

function withSidebarPlatformLabel(
  name: PageTreeItem['name'],
  platform: string,
): PageTreeItem['name'] {
  return createElement(
    'span',
    { className: SIDEBAR_ITEM_CONTENT_CLASS },
    createElement('span', { className: SIDEBAR_ITEM_LABEL_CLASS }, name),
    createElement('span', { className: SIDEBAR_PLATFORM_PILL_CLASS }, platform),
  )
}

function withPlatformLabelOnItem<
  Config extends PlatformSourceConfig = PlatformSourceConfig,
>(context: PageTreeBuilderContext<Config>, item: PageTreeItem): PageTreeItem {
  const platform = readSinglePlatformFromPageData(readPageData(context, item))
  if (platform == null) {
    return item
  }

  return {
    ...item,
    name: withSidebarPlatformLabel(item.name, platform),
  }
}

function withPlatformLabels<
  Config extends PlatformSourceConfig = PlatformSourceConfig,
>(context: PageTreeBuilderContext<Config>, node: PageTreeNode): PageTreeNode {
  if (node.type === 'page') {
    return withPlatformLabelOnItem(context, node)
  }

  if (node.type === 'folder') {
    return {
      ...node,
      index: node.index
        ? withPlatformLabelOnItem(context, node.index)
        : undefined,
      children: node.children.map((child) =>
        withPlatformLabels(context, child),
      ),
    }
  }

  return node
}

export function createPlatformLabelPlugin<
  Config extends PlatformLoaderConfig = PlatformLoaderConfig,
>(): LoaderPlugin<Config> {
  return {
    name: 'page-tree-platform-labels',
    transformPageTree: {
      root(this: PageTreeBuilderContext<Config['source']>, node: PageTreeRoot) {
        return {
          ...node,
          children: node.children.map((child) =>
            withPlatformLabels(this, child),
          ),
        }
      },
    },
  }
}

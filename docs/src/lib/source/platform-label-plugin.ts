import type {
  Item as PageTreeItem,
  Node as PageTreeNode,
  Root as PageTreeRoot,
} from 'fumadocs-core/page-tree'
import type {
  LoaderPlugin,
  PageData,
  PageTreeBuilderContext,
} from 'fumadocs-core/source'
import { createElement } from 'react'
import {
  type PageDataWithPlatforms,
  readSinglePlatformFromPageData,
} from '@/lib/platforms'
import { type PageDataStorage, readPageData } from '@/lib/source/page-tree'

type PlatformPageData = PageData & PageDataWithPlatforms
type PlatformStorage = PageDataStorage<PlatformPageData>

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
  Storage extends PlatformStorage = PlatformStorage,
>(context: PageTreeBuilderContext<Storage>, item: PageTreeItem): PageTreeItem {
  const platform = readSinglePlatformFromPageData(readPageData(context, item))
  if (platform == null) {
    return item
  }

  return {
    ...item,
    name: withSidebarPlatformLabel(item.name, platform),
  }
}

function withPlatformLabels<Storage extends PlatformStorage = PlatformStorage>(
  context: PageTreeBuilderContext<Storage>,
  node: PageTreeNode,
): PageTreeNode {
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
  Storage extends PlatformStorage = PlatformStorage,
>(): LoaderPlugin<Storage> {
  return {
    name: 'page-tree-platform-labels',
    transformPageTree: {
      root(this: PageTreeBuilderContext<Storage>, node: PageTreeRoot) {
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

import type {
  Item as PageTreeItem,
  Node as PageTreeNode,
} from 'fumadocs-core/page-tree'
import type { PageTreeBuilderContext, SourceConfig } from 'fumadocs-core/source'

export type PageDataWithTitle = {
  title?: string
}

export type PageDataWithHybridParent = {
  hybridParent?: string
}

export function getNodeNameAsString(name: PageTreeNode['name']): string {
  return typeof name === 'string' ? name : ''
}

export function readPageData<Config extends SourceConfig>(
  context: PageTreeBuilderContext<Config>,
  item: PageTreeItem,
): Config['pageData'] | null {
  const filePath = item.$ref?.file
  if (typeof filePath !== 'string' || filePath.length === 0) {
    return null
  }

  const file = context.storage.read(filePath)
  if (file == null || file.format !== 'page') {
    return null
  }

  return file.data
}

export function readPageTitle<
  Config extends SourceConfig & { pageData: PageDataWithTitle },
>(context: PageTreeBuilderContext<Config>, item: PageTreeItem): string | null {
  const title = readPageData(context, item)?.title
  return typeof title === 'string' && title.length > 0 ? title : null
}

export function readHybridParent<
  Config extends SourceConfig & { pageData: PageDataWithHybridParent },
>(context: PageTreeBuilderContext<Config>, item: PageTreeItem): string | null {
  const hybridParent = readPageData(context, item)?.hybridParent
  return typeof hybridParent === 'string' && hybridParent.length > 0
    ? hybridParent
    : null
}

export function readStablePageTitle<
  Config extends SourceConfig & { pageData: PageDataWithTitle },
>(context: PageTreeBuilderContext<Config>, item: PageTreeItem): string | null {
  const title = readPageTitle(context, item)
  if (title != null) {
    return title
  }

  return typeof item.name === 'string' && item.name.length > 0
    ? item.name
    : null
}

import type {
  Item as PageTreeItem,
  Node as PageTreeNode,
} from 'fumadocs-core/page-tree'
import type {
  ContentStorage,
  ContentStorageMetaFile,
  ContentStoragePageFile,
  PageData,
  PageTreeBuilderContext,
} from 'fumadocs-core/source'

export type PageDataWithTitle = PageData & {
  title?: string
}

export type PageDataWithHybridParent = PageData & {
  hybridParent?: string
}

export type PageDataStorage<Data extends PageData = PageData> = ContentStorage<
  ContentStoragePageFile<string | undefined, Data>,
  ContentStorageMetaFile
>

export function getNodeNameAsString(name: PageTreeNode['name']): string {
  return typeof name === 'string' ? name : ''
}

export function readPageData<Storage extends PageDataStorage>(
  context: PageTreeBuilderContext<Storage>,
  item: PageTreeItem,
): Storage['$inferPage']['data'] | null {
  const filePath = item.$ref
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
  Storage extends PageDataStorage<PageDataWithTitle>,
>(context: PageTreeBuilderContext<Storage>, item: PageTreeItem): string | null {
  const title = readPageData(context, item)?.title
  return typeof title === 'string' && title.length > 0 ? title : null
}

export function readHybridParent<
  Storage extends PageDataStorage<PageDataWithHybridParent>,
>(context: PageTreeBuilderContext<Storage>, item: PageTreeItem): string | null {
  const hybridParent = readPageData(context, item)?.hybridParent
  return typeof hybridParent === 'string' && hybridParent.length > 0
    ? hybridParent
    : null
}

export function readStablePageTitle<
  Storage extends PageDataStorage<PageDataWithTitle>,
>(context: PageTreeBuilderContext<Storage>, item: PageTreeItem): string | null {
  const title = readPageTitle(context, item)
  if (title != null) {
    return title
  }

  return typeof item.name === 'string' && item.name.length > 0
    ? item.name
    : null
}

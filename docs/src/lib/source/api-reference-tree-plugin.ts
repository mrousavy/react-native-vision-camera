import type {
  Folder as PageTreeFolder,
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
import {
  API_SECTION_NAME_BY_KEY,
  API_SECTION_PRIORITY,
  HYBRID_OBJECT_SECTION_KEYS,
  normalizeApiSectionKey,
} from '@/lib/shared/api-reference.shared'
import {
  getNodeNameAsString,
  type PageDataWithHybridParent,
  type PageDataWithTitle,
  readHybridParent,
  readStablePageTitle,
} from '@/lib/source/page-tree'

type ApiReferencePageData = PageDataWithTitle & PageDataWithHybridParent
type ApiReferenceSourceConfig = SourceConfig & {
  pageData: ApiReferencePageData
}
type ApiReferenceLoaderConfig = LoaderConfig & {
  source: ApiReferenceSourceConfig
}

function withCanonicalSectionName(folder: PageTreeFolder): PageTreeFolder {
  const folderName = getNodeNameAsString(folder.name)
  const sectionKey = normalizeApiSectionKey(folderName)
  const canonicalName = API_SECTION_NAME_BY_KEY.get(sectionKey)
  if (canonicalName == null || canonicalName === folderName) {
    return folder
  }

  return {
    ...folder,
    name: canonicalName,
  }
}

function isHybridObjectsSection(folder: PageTreeFolder): boolean {
  const sectionKey = normalizeApiSectionKey(getNodeNameAsString(folder.name))
  return HYBRID_OBJECT_SECTION_KEYS.has(sectionKey)
}

function reorderSectionFolders(folder: PageTreeFolder): PageTreeFolder {
  const children = [...folder.children]
  const hasSectionFolders = children.some(
    (child) =>
      child.type === 'folder' &&
      API_SECTION_PRIORITY.has(
        normalizeApiSectionKey(getNodeNameAsString(child.name)),
      ),
  )
  if (!hasSectionFolders) {
    return folder
  }

  children.sort((left, right) => {
    if (left.type !== 'folder' && right.type !== 'folder') {
      return 0
    }

    if (left.type !== 'folder') {
      return -1
    }

    if (right.type !== 'folder') {
      return 1
    }

    const leftName = getNodeNameAsString(left.name)
    const rightName = getNodeNameAsString(right.name)
    const leftPriority = API_SECTION_PRIORITY.get(
      normalizeApiSectionKey(leftName),
    )
    const rightPriority = API_SECTION_PRIORITY.get(
      normalizeApiSectionKey(rightName),
    )

    if (leftPriority != null && rightPriority != null) {
      return leftPriority - rightPriority
    }

    if (leftPriority != null) {
      return -1
    }

    if (rightPriority != null) {
      return 1
    }

    return leftName.localeCompare(rightName)
  })

  return {
    ...folder,
    children,
  }
}

function nestHybridObjectChildren<
  Config extends ApiReferenceSourceConfig = ApiReferenceSourceConfig,
>(
  context: PageTreeBuilderContext<Config>,
  folder: PageTreeFolder,
): PageTreeFolder {
  const pageNodes = folder.children.filter(
    (child): child is PageTreeItem => child.type === 'page',
  )
  if (pageNodes.length <= 1) {
    return folder
  }

  const itemByName = new Map<string, PageTreeItem>()
  const order = new Map<string, number>()
  for (let index = 0; index < pageNodes.length; index += 1) {
    const item = pageNodes[index]
    const itemName = readStablePageTitle(context, item)
    if (itemName == null) {
      continue
    }

    if (!itemByName.has(itemName)) {
      itemByName.set(itemName, item)
      order.set(itemName, index)
    }
  }

  if (itemByName.size <= 1) {
    return folder
  }

  const childToParent = new Map<string, string>()
  for (const [name, item] of itemByName.entries()) {
    const parent = readHybridParent(context, item)
    if (
      parent == null ||
      parent === name ||
      !itemByName.has(parent) ||
      childToParent.has(name)
    ) {
      continue
    }

    let cursor: string | undefined = parent
    let createsCycle = false
    while (cursor != null) {
      if (cursor === name) {
        createsCycle = true
        break
      }

      cursor = childToParent.get(cursor)
    }

    if (!createsCycle) {
      childToParent.set(name, parent)
    }
  }

  if (childToParent.size === 0) {
    return folder
  }

  const childrenByParent = new Map<string, string[]>()
  for (const [child, parent] of childToParent.entries()) {
    const children = childrenByParent.get(parent) ?? []
    children.push(child)
    childrenByParent.set(parent, children)
  }

  for (const children of childrenByParent.values()) {
    children.sort(
      (left, right) => (order.get(left) ?? 0) - (order.get(right) ?? 0),
    )
  }

  const builtByName = new Map<string, PageTreeNode>()
  let hybridNodeCounter = 0
  const createHybridNodeId = (seed: string): string => {
    hybridNodeCounter += 1
    const safeSeed = seed.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    return `${context.idPrefix}-hybrid-${safeSeed}-${hybridNodeCounter}`
  }

  const createNode = (
    name: string,
    lineage = new Set<string>(),
  ): PageTreeNode => {
    const fallbackItem = itemByName.get(name)
    if (fallbackItem == null) {
      throw new Error(`Missing item for HybridObject: ${name}`)
    }

    if (lineage.has(name)) {
      return fallbackItem
    }

    const existing = builtByName.get(name)
    if (existing != null) {
      return existing
    }

    const nextLineage = new Set(lineage)
    nextLineage.add(name)

    const nestedChildren = (childrenByParent.get(name) ?? []).map((childName) =>
      createNode(childName, nextLineage),
    )

    if (nestedChildren.length === 0) {
      builtByName.set(name, fallbackItem)
      return fallbackItem
    }

    const nestedFolder: PageTreeFolder = {
      $id: createHybridNodeId(name),
      type: 'folder',
      name: fallbackItem.name,
      index: fallbackItem,
      children: nestedChildren,
    }
    builtByName.set(name, nestedFolder)
    return nestedFolder
  }

  const outputChildren: PageTreeNode[] = []
  const emittedRoots = new Set<string>()
  for (const child of folder.children) {
    if (child.type !== 'page') {
      outputChildren.push(child)
      continue
    }

    const childName = readStablePageTitle(context, child)
    if (
      childName == null ||
      childToParent.has(childName) ||
      emittedRoots.has(childName)
    ) {
      continue
    }

    outputChildren.push(createNode(childName))
    emittedRoots.add(childName)
  }

  for (const name of itemByName.keys()) {
    if (childToParent.has(name) || emittedRoots.has(name)) {
      continue
    }

    outputChildren.push(createNode(name))
    emittedRoots.add(name)
  }

  return {
    ...folder,
    children: outputChildren,
  }
}

function transformApiTreeNode<
  Config extends ApiReferenceSourceConfig = ApiReferenceSourceConfig,
>(context: PageTreeBuilderContext<Config>, node: PageTreeNode): PageTreeNode {
  if (node.type !== 'folder') {
    return node
  }

  const transformedChildren = node.children.map((child) =>
    transformApiTreeNode(context, child),
  )
  const canonicalFolder = withCanonicalSectionName({
    ...node,
    children: transformedChildren,
  })
  const structuredFolder = isHybridObjectsSection(canonicalFolder)
    ? nestHybridObjectChildren(context, canonicalFolder)
    : canonicalFolder

  return reorderSectionFolders(structuredFolder)
}

export function createApiReferenceTreePlugin<
  Config extends ApiReferenceLoaderConfig = ApiReferenceLoaderConfig,
>(): LoaderPlugin<Config> {
  return {
    name: 'api-reference-tree',
    transformPageTree: {
      root(this: PageTreeBuilderContext<Config['source']>, node: PageTreeRoot) {
        return {
          ...node,
          children: node.children.map((child) =>
            transformApiTreeNode(this, child),
          ),
        }
      },
    },
  }
}

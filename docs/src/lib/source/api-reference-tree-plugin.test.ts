import { describe, expect, test } from 'bun:test'
import type { Folder, Item, Root } from 'fumadocs-core/page-tree'
import {
  type ContentStorage,
  type ContentStorageMetaFile,
  type ContentStoragePageFile,
  FileSystem,
  type PageData as FumadocsPageData,
  type PageTreeBuilderContext,
} from 'fumadocs-core/source'
import { createApiReferenceTreePlugin } from '@/lib/source/api-reference-tree-plugin'
import { createPlatformLabelPlugin } from '@/lib/source/platform-label-plugin'

type TestPageData = FumadocsPageData & {
  title: string
  hybridParent?: string
  platforms?: string[]
}

type PageFile = ContentStoragePageFile<undefined, TestPageData>
type PageFileInput = {
  format: 'page'
  data: TestPageData
}
type TestStorage = ContentStorage<PageFile, ContentStorageMetaFile>

function createPage(file: string, title: string): Item {
  return {
    $id: file,
    $ref: file,
    type: 'page',
    name: title,
    url: `/api/${title}`,
  }
}

function createContext(
  files: Record<string, PageFileInput>,
): PageTreeBuilderContext<TestStorage> {
  const storage = new FileSystem<
    PageFile | ContentStorageMetaFile
  >() as TestStorage

  for (const [filePath, file] of Object.entries(files)) {
    storage.write(filePath, {
      type: undefined,
      path: filePath,
      format: 'page',
      slugs: [file.data.title],
      data: file.data,
    })
  }

  const getUrl = () => ''
  // Fumadocs exposes PageTreeBuilder in its type surface, but not from the runtime module.
  const builder = {} as PageTreeBuilderContext<TestStorage>['builder']
  return {
    transformers: [],
    builder,
    storage,
    options: {
      idPrefix: 'test',
      noRef: false,
      url: getUrl,
    },
  }
}

function getNodeTitle(
  node: Folder['children'][number],
  files: Record<string, PageFileInput>,
): string {
  if (node.type === 'folder' && node.index?.$ref) {
    return files[node.index.$ref]?.data.title ?? ''
  }

  if (node.type === 'page' && node.$ref) {
    return files[node.$ref]?.data.title ?? ''
  }

  return ''
}

function getFolderByTitle(root: Root, title: string): Folder {
  const folder = root.children.find(
    (child): child is Folder => child.type === 'folder' && child.name === title,
  )
  if (folder == null) {
    throw new Error(`Missing folder ${title}`)
  }

  return folder
}

function getChildFolderByTitle(
  folder: Folder,
  files: Record<string, PageFileInput>,
  title: string,
): Folder {
  const child = folder.children.find(
    (node): node is Folder =>
      node.type === 'folder' && getNodeTitle(node, files) === title,
  )
  if (child == null) {
    throw new Error(`Missing child folder ${title}`)
  }

  return child
}

describe('api reference tree plugin', () => {
  test('nests platform-labeled hybrid children under their stable hybrid parent', () => {
    const files: Record<string, PageFileInput> = {
      'CameraOutput.mdx': {
        format: 'page',
        data: { title: 'CameraOutput' },
      },
      'CameraObjectOutput.mdx': {
        format: 'page',
        data: {
          title: 'CameraObjectOutput',
          hybridParent: 'CameraOutput',
          platforms: ['iOS'],
        },
      },
      'CameraPhotoOutput.mdx': {
        format: 'page',
        data: {
          title: 'CameraPhotoOutput',
          hybridParent: 'CameraOutput',
        },
      },
      'CameraVideoOutput.mdx': {
        format: 'page',
        data: {
          title: 'CameraVideoOutput',
          hybridParent: 'CameraOutput',
        },
      },
      'ScannedObject.mdx': {
        format: 'page',
        data: { title: 'ScannedObject' },
      },
      'ScannedCode.mdx': {
        format: 'page',
        data: {
          title: 'ScannedCode',
          hybridParent: 'ScannedObject',
          platforms: ['iOS'],
        },
      },
      'ScannedFace.mdx': {
        format: 'page',
        data: {
          title: 'ScannedFace',
          hybridParent: 'ScannedObject',
          platforms: ['iOS'],
        },
      },
    }

    const root: Root = {
      $id: 'root',
      name: 'API',
      children: [
        {
          $id: 'hybrid-objects',
          type: 'folder',
          name: 'HybridObjects',
          children: [
            createPage('CameraOutput.mdx', 'CameraOutput'),
            createPage('CameraObjectOutput.mdx', 'CameraObjectOutput'),
            createPage('CameraPhotoOutput.mdx', 'CameraPhotoOutput'),
            createPage('CameraVideoOutput.mdx', 'CameraVideoOutput'),
            createPage('ScannedObject.mdx', 'ScannedObject'),
            createPage('ScannedCode.mdx', 'ScannedCode'),
            createPage('ScannedFace.mdx', 'ScannedFace'),
          ],
        },
      ],
    }

    const context = createContext(files)
    const apiTreePlugin = createApiReferenceTreePlugin<TestStorage>()
    const platformLabelPlugin = createPlatformLabelPlugin<TestStorage>()
    const transformApiTree = apiTreePlugin.transformPageTree?.root
    const transformPlatformLabels = platformLabelPlugin.transformPageTree?.root

    if (transformApiTree == null || transformPlatformLabels == null) {
      throw new Error('Expected page-tree plugins to expose a root transform.')
    }

    const treeAfterStructure = transformApiTree.call(context, root)
    const treeAfterLabels = transformPlatformLabels.call(
      context,
      treeAfterStructure,
    )

    const hybridObjectsFolder = getFolderByTitle(
      treeAfterLabels,
      'HybridObjects',
    )
    const cameraOutputFolder = getChildFolderByTitle(
      hybridObjectsFolder,
      files,
      'CameraOutput',
    )
    const scannedObjectFolder = getChildFolderByTitle(
      hybridObjectsFolder,
      files,
      'ScannedObject',
    )

    expect(
      cameraOutputFolder.children.map((child) => getNodeTitle(child, files)),
    ).toEqual(['CameraObjectOutput', 'CameraPhotoOutput', 'CameraVideoOutput'])
    expect(
      scannedObjectFolder.children.map((child) => getNodeTitle(child, files)),
    ).toEqual(['ScannedCode', 'ScannedFace'])
  })
})

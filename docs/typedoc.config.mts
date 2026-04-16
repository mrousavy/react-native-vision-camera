import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { OptionDefaults, type TypeDocOptions } from 'typedoc'
import type { PluginOptions as MarkdownPluginOptions } from 'typedoc-plugin-markdown'
import { externalSymbolLinkMappings } from './config/external-symbol-link-mappings.ts'

const docsRoot = process.cwd()
const repoRoot = path.resolve(docsRoot, '..')

const blockTags: Array<`@${string}`> = [
  ...OptionDefaults.blockTags,
  '@platform',
  '@note',
  '@discussion',
  '@worklet',
]

const compilerOptions = {
  baseUrl: docsRoot,
  // Package mode uses each package's tsconfig; disable composite/file-list checks
  // so cross-package source imports resolve in monorepo CI environments.
  composite: false,
  rootDir: repoRoot,
  paths: {
    'react-native-vision-camera': [
      '../packages/react-native-vision-camera/src/index.ts',
    ],
    'react-native-vision-camera/*': [
      '../packages/react-native-vision-camera/src/*',
    ],
    'react-native-vision-camera-*': [
      '../packages/react-native-vision-camera-*/src/index.ts',
    ],
  },
}

type VisionCameraTypeDocOptions = Partial<
  TypeDocOptions & MarkdownPluginOptions
> & {
  packageOptions?: Partial<TypeDocOptions & MarkdownPluginOptions>
}

const config = {
  name: 'API Reference',
  entryPointStrategy: 'packages',
  entryPoints: [
    path.join(repoRoot, 'packages', 'react-native-vision-camera'),
    path.join(repoRoot, 'packages', 'react-native-vision-camera-*'),
  ],
  packageOptions: {
    entryPoints: ['src/index.ts'],
    exclude: ['**/index.ts'],
    readme: 'none',
    blockTags: blockTags,
    useCodeBlocks: true,
    expandParameters: true,
    disableSources: true,
    excludePrivate: true,
    excludeProtected: true,
    excludeExternals: true,
    excludeInternal: true,
    validation: {
      invalidLink: true,
      notExported: false,
      rewrittenLink: true,
    },
    compilerOptions: compilerOptions,
  },
  plugin: [
    'typedoc-plugin-markdown',
    'typedoc-plugin-frontmatter',
    fileURLToPath(
      new URL('./scripts/typedoc-inheritance-fixes.mts', import.meta.url),
    ),
    fileURLToPath(new URL('./scripts/typedoc-router.mts', import.meta.url)),
    fileURLToPath(new URL('./scripts/typedoc-theme.mts', import.meta.url)),
    fileURLToPath(
      new URL('./scripts/typedoc-frontmatter.mts', import.meta.url),
    ),
    fileURLToPath(
      new URL('./scripts/typedoc-markdown-pages.mts', import.meta.url),
    ),
  ],
  theme: 'vision-camera-markdown',
  router: 'vision-camera',
  out: path.join(docsRoot, 'content', 'api'),
  excludePrivate: true,
  excludeProtected: true,
  excludeExternals: true,
  excludeInternal: true,
  disableSources: true,
  readme: 'none',
  skipErrorChecking: true,
  fileExtension: '.mdx',
  entryFileName: 'index',
  useCodeBlocks: true,
  expandParameters: true,
  hidePageHeader: true,
  hidePageTitle: true,
  hideBreadcrumbs: true,
  blockTags,
  validation: {
    invalidLink: true,
    notExported: false,
    rewrittenLink: true,
  },
  treatValidationWarningsAsErrors: true,
  externalSymbolLinkMappings,
} satisfies VisionCameraTypeDocOptions

export default config

import { execFileSync } from 'node:child_process'
import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/site-config'
import { apiSource, docsSource } from '@/lib/source'

export const dynamic = 'force-static'

const DOCS_CONTENT_ROOT = 'content/docs'

const HOME_LAST_MODIFIED_PATHS = [
  'src/app/(home)/page.tsx',
  'src/app/(home)/layout.tsx',
  'src/app/layout.tsx',
  'src/components/landing',
  'src/lib/site-config.ts',
  'src/lib/structured-data.ts',
  'public/vc_logo.svg',
  'public/img/landing-bg-back.webp',
  'public/img/landing-bg-front.webp',
]

const API_PACKAGE_NAMES = [
  'react-native-vision-camera',
  'react-native-vision-camera-barcode-scanner',
  'react-native-vision-camera-location',
  'react-native-vision-camera-resizer',
  'react-native-vision-camera-skia',
  'react-native-vision-camera-worklets',
]

const API_DOC_GENERATOR_PATHS = [
  'typedoc.config.mts',
  'source.config.ts',
  'config/api-reference.ts',
  'config/external-symbol-link-mappings.ts',
  'scripts/typedoc-frontmatter.mts',
  'scripts/typedoc-inheritance-fixes.mts',
  'scripts/typedoc-markdown-pages.mts',
  'scripts/typedoc-reflection-classification.mts',
  'scripts/typedoc-reflection-metadata.mts',
  'scripts/typedoc-router.mts',
  'scripts/typedoc-theme.mts',
  'src/lib/source/api-reference-tree-plugin.ts',
]

const lastModifiedCache = new Map<string, Date | undefined>()

function getGitLastModified(paths: string[]): Date | undefined {
  const cacheKey = paths.join('\0')
  if (lastModifiedCache.has(cacheKey)) {
    return lastModifiedCache.get(cacheKey)
  }

  let lastModified: Date | undefined

  try {
    const output = execFileSync(
      'git',
      ['log', '-1', '--format=%cI', '--', ...paths],
      {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      },
    ).trim()

    if (output.length > 0) {
      const date = new Date(output)
      if (!Number.isNaN(date.getTime())) {
        lastModified = date
      }
    }
  } catch {
    lastModified = undefined
  }

  lastModifiedCache.set(cacheKey, lastModified)
  return lastModified
}

function withLastModified(
  entry: Omit<MetadataRoute.Sitemap[number], 'lastModified'>,
  paths: string[],
): MetadataRoute.Sitemap[number] {
  const lastModified = getGitLastModified(paths)
  return lastModified == null ? entry : { ...entry, lastModified }
}

function getDocsPageLastModifiedPaths(pagePath: string): string[] {
  return [`${DOCS_CONTENT_ROOT}/${pagePath}`]
}

function getApiPackagePaths(packageName: string): string[] {
  return [
    `../packages/${packageName}/src`,
    `../packages/${packageName}/package.json`,
  ]
}

function getApiPageLastModifiedPaths(pagePath: string): string[] {
  const packageName = pagePath.split('/')[0]

  if (API_PACKAGE_NAMES.includes(packageName)) {
    return [...API_DOC_GENERATOR_PATHS, ...getApiPackagePaths(packageName)]
  }

  return [
    ...API_DOC_GENERATOR_PATHS,
    ...API_PACKAGE_NAMES.flatMap(getApiPackagePaths),
  ]
}

export default function sitemap(): MetadataRoute.Sitemap {
  const docsPages = docsSource.getPages().map((page) =>
    withLastModified(
      {
        url: absoluteUrl(page.url),
        changeFrequency: 'weekly',
        priority: page.url === '/docs' ? 0.9 : 0.7,
      },
      getDocsPageLastModifiedPaths(page.path),
    ),
  )

  const apiPages = apiSource.getPages().map((page) =>
    withLastModified(
      {
        url: absoluteUrl(page.url),
        changeFrequency: 'weekly',
        priority: page.url === '/api' ? 0.8 : 0.6,
      },
      getApiPageLastModifiedPaths(page.path),
    ),
  )

  return [
    withLastModified(
      {
        url: absoluteUrl('/'),
        changeFrequency: 'monthly',
        priority: 1.0,
      },
      HOME_LAST_MODIFIED_PATHS,
    ),
    ...docsPages,
    ...apiPages,
  ]
}

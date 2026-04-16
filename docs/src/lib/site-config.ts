const DEFAULT_SITE_URL = 'https://visioncamera.margelo.com'
const DEFAULT_BRANCH = 'main'

export const siteConfig = {
  name: 'VisionCamera',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL),
  repositoryUrl: 'https://github.com/margelo/react-native-vision-camera-v5',
  repositoryBranch: DEFAULT_BRANCH,
  contentRoots: {
    docs: 'docs/content/docs',
    api: 'docs/content/api',
  },
  og: {
    width: 1200,
    height: 630,
    site: 'VisionCamera',
  },
} as const

export type DocsScope = keyof typeof siteConfig.contentRoots

export function absoluteUrl(pathname: string): string {
  return new URL(pathname, siteConfig.metadataBase).toString()
}

export function getMarkdownPath(pageUrl: string): string {
  return `${pageUrl}.mdx`
}

export function getOgImageUrl(pageUrl: string): string {
  // /docs/zooming -> /og/docs/zooming, /api/foo -> /og/api/foo, / -> /og
  return pageUrl === '/' ? '/og' : `/og${pageUrl}`
}

export function getOgImage(pageUrl: string) {
  return {
    url: getOgImageUrl(pageUrl),
    width: siteConfig.og.width,
    height: siteConfig.og.height,
  }
}

export function getGithubContentUrl(
  scope: DocsScope,
  pagePath: string,
): string {
  const root = siteConfig.contentRoots[scope]
  return `${siteConfig.repositoryUrl}/blob/${siteConfig.repositoryBranch}/${root}/${pagePath}`
}

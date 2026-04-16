import fs from 'node:fs'
import path from 'node:path'
import type { Application } from 'typedoc'
import { MarkdownPageEvent } from 'typedoc-plugin-markdown'

const repoRoot = path.resolve(process.cwd(), '..')
const packagesRoot = path.join(repoRoot, 'packages')
const PACKAGE_INDEX_PATTERN = /^(react-native-vision-camera[^/]*)\/index\.mdx$/

function splitFrontmatter(markdown: string): {
  frontmatter: string
  body: string
} {
  if (!markdown.startsWith('---\n')) {
    return { frontmatter: '', body: markdown }
  }

  const match = markdown.match(/^---\n[\s\S]*?\n---\n*/)
  if (match == null) {
    return { frontmatter: '', body: markdown }
  }

  return {
    frontmatter: match[0],
    body: markdown.slice(match[0].length),
  }
}

function joinFrontmatter(frontmatter: string, body: string): string {
  const trimmedBody = body.trim()
  if (frontmatter.length === 0) {
    return trimmedBody.length === 0 ? '' : `${trimmedBody}\n`
  }

  if (trimmedBody.length === 0) {
    return frontmatter
  }

  return `${frontmatter}${trimmedBody}\n`
}

function getPackageNameFromIndexUrl(url: string | undefined): string | null {
  if (typeof url !== 'string') {
    return null
  }

  const normalizedUrl = url.replace(/\\/g, '/')
  const match = normalizedUrl.match(PACKAGE_INDEX_PATTERN)
  return match?.[1] ?? null
}

function stripLeadingReadmeHeading(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  while (lines.length > 0 && lines[0].trim().length === 0) {
    lines.shift()
  }

  if (lines.length > 0 && /^#\s+/.test(lines[0])) {
    lines.shift()
  }

  while (lines.length > 0 && lines[0].trim().length === 0) {
    lines.shift()
  }

  return lines.join('\n').trim()
}

function getPackageReadmeContent(packageName: string): string | null {
  const readmePath = path.join(packagesRoot, packageName, 'README.md')
  if (!fs.existsSync(readmePath)) {
    return null
  }

  const readme = fs.readFileSync(readmePath, 'utf8')
  const body = stripLeadingReadmeHeading(readme)
  return body.length > 0 ? body : null
}

function replacePackageIndexBody(
  markdown: string,
  packageName: string,
): string {
  const readmeBody = getPackageReadmeContent(packageName)
  if (readmeBody == null) {
    return markdown
  }

  const { frontmatter } = splitFrontmatter(markdown)
  return joinFrontmatter(frontmatter, readmeBody)
}

export function load(app: Application): void {
  app.renderer.on(MarkdownPageEvent.END, (page) => {
    const packageName = getPackageNameFromIndexUrl(page.url)
    if (packageName == null) {
      return
    }

    if (page.contents != null) {
      page.contents = replacePackageIndexBody(page.contents, packageName)
    }
  })
}

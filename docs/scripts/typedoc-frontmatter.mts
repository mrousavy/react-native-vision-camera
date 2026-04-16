import {
  type Application,
  Comment,
  type CommentDisplayPart,
  type Context,
  Converter,
  type DeclarationReflection,
  type PageEvent,
} from 'typedoc'
import { MarkdownPageEvent } from 'typedoc-plugin-markdown'
import {
  canonicalPlatformLabels,
  defaultPlatformOrder,
} from '../config/platforms.ts'
import {
  normalizePlatformLabelWithLookup,
  orderPlatformLabelsWithOrder,
} from '../src/lib/shared/platforms-core.ts'
import { annotateProjectOwnTypeLevelDocumentation } from '../src/lib/typedoc/inherited-type-level-comments.ts'
import {
  createHybridInterfaceResolver,
  getDirectHybridParentName,
} from './typedoc-reflection-classification.mts'
import {
  getReflectionPlatforms,
  setReflectionPlatforms,
} from './typedoc-reflection-metadata.mts'

type PageEventWithFrontmatter = PageEvent & {
  frontmatter?: Record<string, unknown>
}

function hasPageFrontmatter(page: PageEvent): page is PageEventWithFrontmatter {
  return 'frontmatter' in page
}

function isDeclarationReflection(
  reflection: unknown,
): reflection is DeclarationReflection {
  return (
    reflection != null &&
    typeof reflection === 'object' &&
    'kind' in reflection &&
    'getAllSignatures' in reflection
  )
}

const PACKAGE_NAME_PREFIX = 'react-native-vision-camera'

function isPackageName(value: string | undefined): boolean {
  return value?.startsWith(PACKAGE_NAME_PREFIX) ?? false
}

function getPageTitle(
  pageUrl: string | undefined,
  modelName: string | undefined,
): string {
  const normalizedUrl = pageUrl?.replace(/\\/g, '/')
  const packageIndexMatch = normalizedUrl?.match(
    /^(react-native-vision-camera[^/]*)\/index\.mdx$/,
  )
  const packageNameFromUrl = packageIndexMatch?.[1]

  if (isPackageName(packageNameFromUrl)) {
    return packageNameFromUrl!
  }

  if (isPackageName(modelName)) {
    return modelName!
  }

  return modelName || 'API Reference'
}

function parsePlatformTagContent(content: string): string[] {
  const candidates = content
    .split(/(?:\n|,|\/|&|\band\b|\bor\b)+/gi)
    .map((value) =>
      normalizePlatformLabelWithLookup(value, canonicalPlatformLabels),
    )
    .filter((value): value is string => value != null)

  return orderPlatformLabelsWithOrder(candidates, defaultPlatformOrder)
}

function extractPlatformsFromComment(
  comment: Comment | null | undefined,
): string[] {
  if (comment == null) {
    return []
  }

  const platformTags = comment.getTags('@platform')
  if (platformTags.length === 0) {
    return []
  }

  const platforms: string[] = []
  for (const platformTag of platformTags) {
    const text = Comment.combineDisplayParts(platformTag.content)
    platforms.push(...parsePlatformTagContent(text))
  }

  comment.removeTags('@platform')
  return orderPlatformLabelsWithOrder(platforms, defaultPlatformOrder)
}

function collectReflectionPlatforms(
  reflection: DeclarationReflection,
): string[] {
  const platforms = new Set<string>(
    extractPlatformsFromComment(reflection.comment),
  )

  const signatures = Array.isArray(reflection.signatures)
    ? reflection.signatures
    : []
  for (const signature of signatures) {
    const signaturePlatforms = extractPlatformsFromComment(signature.comment)
    if (signaturePlatforms.length > 0) {
      setReflectionPlatforms(signature, signaturePlatforms)
      for (const platform of signaturePlatforms) {
        platforms.add(platform)
      }
    } else {
      setReflectionPlatforms(signature, [])
    }
  }

  const accessorSignatures = [
    reflection.getSignature,
    reflection.setSignature,
  ].filter(
    (signature): signature is NonNullable<typeof signature> =>
      signature != null,
  )
  for (const signature of accessorSignatures) {
    const signaturePlatforms = extractPlatformsFromComment(signature.comment)
    if (signaturePlatforms.length > 0) {
      setReflectionPlatforms(signature, signaturePlatforms)
      for (const platform of signaturePlatforms) {
        platforms.add(platform)
      }
    } else {
      setReflectionPlatforms(signature, [])
    }
  }

  return orderPlatformLabelsWithOrder(platforms, defaultPlatformOrder)
}

function getReflectionPlatformsWithFallback(
  reflection: DeclarationReflection,
): string[] {
  const existing = getReflectionPlatforms(reflection)
  if (existing.length > 0) {
    return existing
  }

  const collected = collectReflectionPlatforms(reflection)
  setReflectionPlatforms(reflection, collected)
  return collected
}

function getMemberHeadingTitle(
  reflection: DeclarationReflection | null | undefined,
): string | null {
  if (reflection == null || typeof reflection !== 'object') {
    return null
  }

  if (typeof reflection.name !== 'string' || reflection.name.length === 0) {
    return null
  }

  const hasSignatures =
    Array.isArray(reflection.signatures) && reflection.signatures.length > 0
  const isOptional = reflection.flags?.isOptional === true

  return `${reflection.name}${hasSignatures ? '()' : ''}${isOptional ? '?' : ''}`
}

function collectMemberPlatformsByHeading(
  reflection: DeclarationReflection | null | undefined,
): Record<string, string[]> {
  if (reflection == null || typeof reflection !== 'object') {
    return {}
  }

  if (!Array.isArray(reflection.children)) {
    return {}
  }

  const tocPlatforms: Record<string, string[]> = {}

  for (const child of reflection.children) {
    const headingTitle = getMemberHeadingTitle(child)
    if (headingTitle == null) {
      continue
    }

    const platforms = getReflectionPlatformsWithFallback(child)
    if (platforms.length === 0) {
      continue
    }

    const existing = Array.isArray(tocPlatforms[headingTitle])
      ? tocPlatforms[headingTitle]
      : []
    tocPlatforms[headingTitle] = orderPlatformLabelsWithOrder(
      [...existing, ...platforms],
      defaultPlatformOrder,
    )
  }

  return tocPlatforms
}

/**
 * Extract a plain-text description from a comment summary's display parts.
 * Uses the structured display-part data directly (no regex on serialised
 * markup), so inline tags like `{@linkcode Foo}` are resolved to their
 * display text automatically.  Returns the first sentence, or the full
 * summary if no sentence boundary is found; `null` when empty.
 */
function getFirstSentencePlainText(
  parts: readonly CommentDisplayPart[],
): string | null {
  const plainText = parts.map((part) => part.text).join('')
  const trimmed = plainText.trim()
  if (trimmed.length === 0) return null

  const firstSentence = trimmed.match(/^.+?[.!?](?:\s|$)/s)?.[0]?.trim()
  return firstSentence ?? trimmed
}

export function load(app: Application): void {
  const isHybridInterfaceByProject = new WeakMap<
    object,
    ReturnType<typeof createHybridInterfaceResolver>
  >()

  app.converter.on(Converter.EVENT_RESOLVE_END, (context: Context) => {
    annotateProjectOwnTypeLevelDocumentation(context)
  })

  app.renderer.on(MarkdownPageEvent.BEGIN, (page: PageEvent) => {
    const model = page.model
    const modelName = 'name' in model ? model.name : undefined
    const title = getPageTitle(page.url, modelName)

    let platforms: string[] = []
    let tocPlatforms: Record<string, string[]> = {}
    let hybridParent: string | null = null

    let description: string | null = null

    if (isDeclarationReflection(model)) {
      platforms = getReflectionPlatformsWithFallback(model)
      tocPlatforms = collectMemberPlatformsByHeading(model)

      const summary =
        model.comment?.summary ?? model.signatures?.[0]?.comment?.summary
      if (summary != null && summary.length > 0) {
        description = getFirstSentencePlainText(summary)
      }

      const isHybridInterface =
        page.project != null
          ? (isHybridInterfaceByProject.get(page.project) ??
            createHybridInterfaceResolver(page.project))
          : null

      if (
        page.project != null &&
        isHybridInterface != null &&
        !isHybridInterfaceByProject.has(page.project)
      ) {
        isHybridInterfaceByProject.set(page.project, isHybridInterface)
      }

      hybridParent =
        page.project != null && isHybridInterface != null
          ? getDirectHybridParentName(model, page.project, isHybridInterface)
          : null
    }

    if (hasPageFrontmatter(page)) {
      page.frontmatter = {
        ...page.frontmatter,
        title,
        ...(description != null ? { description } : {}),
        ...(platforms.length > 0 ? { platforms } : {}),
        ...(Object.keys(tocPlatforms).length > 0 ? { tocPlatforms } : {}),
        ...(hybridParent != null ? { hybridParent } : {}),
      }
    }
  })
}

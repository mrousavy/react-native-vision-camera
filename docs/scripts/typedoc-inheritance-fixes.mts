import {
  type Application,
  type Context,
  Converter,
  type ProjectReflection,
  ReferenceType,
  type Reflection,
} from 'typedoc'
import { MarkdownRendererEvent } from 'typedoc-plugin-markdown'

const INHERITANCE_REFERENCE_FIELDS = [
  'inheritedFrom',
  'implementationOf',
  'overwrites',
] as const

/**
 * Reflections that carry inheritance metadata.
 * Both DeclarationReflection and SignatureReflection have these fields,
 * but the base Reflection type doesn't declare them.
 */
type InheritanceReflection = Reflection & {
  inheritedFrom?: ReferenceType
  implementationOf?: ReferenceType
  overwrites?: ReferenceType
}

function hasInheritanceFields(
  reflection: Reflection,
): reflection is InheritanceReflection {
  return 'inheritedFrom' in reflection
}

function getLocalQualifiedName(reflection: Reflection): string | null {
  const segments: string[] = []
  let cursor: Reflection | undefined = reflection
  while (
    cursor != null &&
    cursor.parent != null &&
    !cursor.parent.isProject()
  ) {
    if (cursor.name.length > 0) {
      segments.unshift(cursor.name)
    }
    cursor = cursor.parent
  }

  return segments.length > 0 ? segments.join('.') : null
}

function parseQualifiedPath(value: string): string[] | null {
  if (value.length === 0) {
    return null
  }

  const path = value.split('.').filter((segment) => segment.length > 0)
  if (path.length < 2) {
    return null
  }

  return path
}

function getModuleRoot(reflection: Reflection): Reflection {
  let cursor = reflection
  while (cursor.parent != null && !cursor.parent.isProject()) {
    cursor = cursor.parent
  }
  return cursor
}

function buildDeclaredOrigins(
  project: ProjectReflection,
): Map<string, Reflection> {
  const declaredByQualifiedName = new Map<string, Reflection>()

  for (const reflection of Object.values(project.reflections)) {
    if (!hasInheritanceFields(reflection)) {
      continue
    }

    if (reflection.inheritedFrom != null) {
      continue
    }

    const qualifiedName = getLocalQualifiedName(reflection)
    if (qualifiedName == null) {
      continue
    }

    if (!declaredByQualifiedName.has(qualifiedName)) {
      declaredByQualifiedName.set(qualifiedName, reflection)
    }
  }

  return declaredByQualifiedName
}

function resolveReflectionByQualifiedName(
  project: ProjectReflection,
  owner: Reflection,
  qualifiedName: string,
): Reflection | null {
  const path = parseQualifiedPath(qualifiedName)
  if (path == null) {
    return null
  }

  // Resolve relative to the owning module first to avoid cross-package collisions.
  const moduleRoot = getModuleRoot(owner)
  const localMatch = moduleRoot.getChildByName(path)
  if (localMatch != null) {
    return localMatch
  }

  // Fallback for unusual layouts where module-relative lookup fails.
  const projectChildren = project.children ?? []
  for (const child of projectChildren) {
    const match = child.getChildByName(path)
    if (match != null) {
      return match
    }
  }

  return null
}

function resolveReferenceTarget(
  project: ProjectReflection,
  owner: Reflection,
  reference: ReferenceType,
): Reflection | null {
  if (reference.reflection != null) {
    return reference.reflection
  }

  return resolveReflectionByQualifiedName(project, owner, reference.name)
}

function findDeclaredOrigin(
  project: ProjectReflection,
  owner: Reflection,
  qualifiedName: string,
  reflection: Reflection,
  declaredByQualifiedName: Map<string, Reflection>,
): Reflection | null {
  const declaredOrigin = declaredByQualifiedName.get(qualifiedName)
  if (declaredOrigin != null) {
    return declaredOrigin
  }

  let current = reflection
  const visitedIds = new Set<number>()

  while (hasInheritanceFields(current) && current.inheritedFrom != null) {
    if (visitedIds.has(current.id)) {
      break
    }
    visitedIds.add(current.id)

    const inheritedReflection = resolveReferenceTarget(
      project,
      current,
      current.inheritedFrom,
    )
    if (inheritedReflection == null || inheritedReflection === current) {
      break
    }

    current = inheritedReflection
  }

  if (!hasInheritanceFields(current) || current.inheritedFrom == null) {
    return current
  }

  const origin = resolveReflectionByQualifiedName(project, owner, qualifiedName)
  if (
    origin != null &&
    (!hasInheritanceFields(origin) || origin.inheritedFrom == null)
  ) {
    return origin
  }

  return current
}

function normalizeInheritanceReference(
  project: ProjectReflection,
  owner: InheritanceReflection,
  fieldName: keyof Pick<
    InheritanceReflection,
    'inheritedFrom' | 'implementationOf' | 'overwrites'
  >,
  declaredByQualifiedName: Map<string, Reflection>,
): boolean {
  const reference = owner[fieldName]
  if (reference == null) {
    return false
  }

  const resolved = resolveReferenceTarget(project, owner, reference)
  if (resolved == null) {
    return false
  }

  const declaredOrigin = findDeclaredOrigin(
    project,
    owner,
    reference.name,
    resolved,
    declaredByQualifiedName,
  )
  if (declaredOrigin == null) {
    return false
  }

  const currentTargetId = reference.reflection?.id ?? null
  if (currentTargetId === declaredOrigin.id) {
    return false
  }

  owner[fieldName] = ReferenceType.createResolvedReference(
    reference.name,
    declaredOrigin,
    project,
  )
  return true
}

function normalizeProjectInheritanceReferences(
  project: ProjectReflection,
): number {
  const declaredByQualifiedName = buildDeclaredOrigins(project)
  let fixCount = 0
  for (const reflection of Object.values(project.reflections)) {
    if (!hasInheritanceFields(reflection)) {
      continue
    }

    for (const fieldName of INHERITANCE_REFERENCE_FIELDS) {
      if (
        normalizeInheritanceReference(
          project,
          reflection,
          fieldName,
          declaredByQualifiedName,
        )
      ) {
        fixCount += 1
      }
    }
  }
  return fixCount
}

export function load(app: Application): void {
  const normalizeAndLog = (project: ProjectReflection): void => {
    const fixCount = normalizeProjectInheritanceReferences(project)
    if (fixCount > 0) {
      app.logger.verbose(
        `[typedoc-inheritance-fixes] normalized ${fixCount} inherited reference links`,
      )
    }
  }

  app.converter.on(Converter.EVENT_RESOLVE_END, (context: Context) => {
    normalizeAndLog(context.project)
  })

  app.renderer.on(
    MarkdownRendererEvent.BEGIN,
    (event: MarkdownRendererEvent) => {
      normalizeAndLog(event.project)
    },
  )
}

import { type Comment, type ProjectReflection, ReflectionKind } from 'typedoc'
import ts from 'typescript'

const HAS_OWN_TYPE_LEVEL_DOCS_FIELD =
  '__visionCameraHasOwnTypeLevelDocs' as const

type ReflectionWithTypeLevelDocs<T extends object = object> = T & {
  [HAS_OWN_TYPE_LEVEL_DOCS_FIELD]?: boolean
}

type ConverterContext = {
  checker: ts.TypeChecker
  getSymbolFromReflection(reflection: object): ts.Symbol | undefined
  project: ProjectReflection
}

type TypeLevelReflection = {
  kind: ReflectionKind
  comment?: Comment
  extendedTypes?: Array<{
    reflection?: object
    target?: number
  }>
}

function isTypeLevelReflection(
  reflection: unknown,
): reflection is TypeLevelReflection {
  if (reflection == null || typeof reflection !== 'object') {
    return false
  }

  const kind = (reflection as TypeLevelReflection).kind
  return (
    kind === ReflectionKind.Interface ||
    kind === ReflectionKind.Class ||
    kind === ReflectionKind.TypeAlias
  )
}

function hasJSDocCommentText(value: unknown): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0
  }

  if (!Array.isArray(value)) {
    return false
  }

  return value.some((part) => {
    if (part == null || typeof part !== 'object') {
      return false
    }

    if (typeof (part as { text?: unknown }).text !== 'string') {
      return false
    }

    return (part as { text: string }).text.trim().length > 0
  })
}

function declarationHasOwnJSDoc(declaration: ts.Declaration): boolean {
  const jsDocNodes = ts.getJSDocCommentsAndTags(declaration)
  if (jsDocNodes.length === 0) {
    return false
  }

  return jsDocNodes.some((node) => {
    if (!ts.isJSDoc(node)) {
      return true
    }

    if (hasJSDocCommentText(node.comment)) {
      return true
    }

    return Array.isArray(node.tags) && node.tags.length > 0
  })
}

function declarationMatchesReflectionKind(
  reflection: TypeLevelReflection,
  declaration: ts.Declaration,
): boolean {
  if (reflection.kind === ReflectionKind.Interface) {
    return ts.isInterfaceDeclaration(declaration)
  }

  if (reflection.kind === ReflectionKind.Class) {
    return ts.isClassDeclaration(declaration)
  }

  if (reflection.kind === ReflectionKind.TypeAlias) {
    return ts.isTypeAliasDeclaration(declaration)
  }

  return false
}

function getDeclarationsForReflection(
  context: ConverterContext,
  reflection: object,
): ts.Declaration[] {
  const symbol = context.getSymbolFromReflection(reflection)
  if (symbol == null) {
    return []
  }

  const declarations: ts.Declaration[] = []
  const visited = new Set<string>()

  const pushDeclarations = (candidate: ts.Symbol | undefined) => {
    const nodes = candidate?.declarations
    if (!Array.isArray(nodes)) {
      return
    }

    for (const node of nodes) {
      const key = `${node.pos}:${node.end}:${node.kind}`
      if (visited.has(key)) {
        continue
      }

      visited.add(key)
      declarations.push(node)
    }
  }

  pushDeclarations(symbol)

  if ((symbol.flags & ts.SymbolFlags.Alias) !== 0) {
    pushDeclarations(context.checker.getAliasedSymbol(symbol))
  }

  return declarations
}

function commentHasPlatformTag(comment: Comment | undefined): boolean {
  if (comment == null) {
    return false
  }

  return comment.getTags('@platform').length > 0
}

function getExtendedParentReflections(
  reflection: TypeLevelReflection,
  project: ProjectReflection,
): object[] {
  if (!Array.isArray(reflection.extendedTypes)) {
    return []
  }

  const parents: object[] = []
  for (const extendedType of reflection.extendedTypes) {
    if (extendedType?.reflection != null) {
      parents.push(extendedType.reflection)
      continue
    }

    if (typeof extendedType?.target !== 'number') {
      continue
    }

    const parentReflection = project.reflections[extendedType.target]
    if (parentReflection != null) {
      parents.push(parentReflection)
    }
  }

  return parents
}

export function getHasOwnTypeLevelDocs(
  reflection: unknown,
): boolean | undefined {
  if (reflection == null || typeof reflection !== 'object') {
    return undefined
  }

  return (reflection as ReflectionWithTypeLevelDocs)[
    HAS_OWN_TYPE_LEVEL_DOCS_FIELD
  ]
}

export function setHasOwnTypeLevelDocs(
  reflection: unknown,
  hasOwnTypeLevelDocs: boolean | undefined,
): void {
  if (reflection == null || typeof reflection !== 'object') {
    return
  }

  const target = reflection as ReflectionWithTypeLevelDocs
  if (hasOwnTypeLevelDocs == null) {
    delete target[HAS_OWN_TYPE_LEVEL_DOCS_FIELD]
    return
  }

  target[HAS_OWN_TYPE_LEVEL_DOCS_FIELD] = hasOwnTypeLevelDocs
}

export function hasOwnTypeLevelDocumentation(
  context: ConverterContext,
  reflection: unknown,
): boolean {
  if (!isTypeLevelReflection(reflection)) {
    return false
  }

  const declarations = getDeclarationsForReflection(context, reflection)
  if (declarations.length === 0) {
    return false
  }

  return declarations.some((declaration) => {
    if (!declarationMatchesReflectionKind(reflection, declaration)) {
      return false
    }

    return declarationHasOwnJSDoc(declaration)
  })
}

export function annotateOwnTypeLevelDocumentation(
  context: ConverterContext,
  reflection: unknown,
): boolean | undefined {
  if (!isTypeLevelReflection(reflection)) {
    setHasOwnTypeLevelDocs(reflection, undefined)
    return undefined
  }

  const hasOwnTypeLevelDocs = hasOwnTypeLevelDocumentation(context, reflection)
  setHasOwnTypeLevelDocs(reflection, hasOwnTypeLevelDocs)
  return hasOwnTypeLevelDocs
}

export function annotateProjectOwnTypeLevelDocumentation(
  context: ConverterContext,
): void {
  for (const reflection of Object.values(context.project.reflections)) {
    annotateOwnTypeLevelDocumentation(context, reflection)
  }
}

export function shouldSuppressInheritedTypeLevelComment(
  reflection: unknown,
  project: ProjectReflection | undefined,
): boolean {
  if (
    !isTypeLevelReflection(reflection) ||
    project == null ||
    reflection.kind !== ReflectionKind.Interface ||
    reflection.comment == null ||
    !Array.isArray(reflection.extendedTypes)
  ) {
    return false
  }

  if (getHasOwnTypeLevelDocs(reflection) !== false) {
    return false
  }

  // Preserve platform-only comments so the renderer can still surface platform metadata.
  if (commentHasPlatformTag(reflection.comment)) {
    return false
  }

  const parentReflections = getExtendedParentReflections(reflection, project)
  return parentReflections.some((parentReflection) => {
    return (
      parentReflection != null &&
      typeof parentReflection === 'object' &&
      'comment' in parentReflection &&
      (parentReflection as { comment?: Comment }).comment != null
    )
  })
}

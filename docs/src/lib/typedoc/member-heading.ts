import type { DeclarationReflection, SignatureReflection } from 'typedoc'

function getTypeDeclaration(
  reflection: DeclarationReflection,
): DeclarationReflection | undefined {
  const type = reflection.type
  if (type == null || typeof type !== 'object' || !('declaration' in type)) {
    return undefined
  }
  return (type as { declaration?: DeclarationReflection }).declaration
}

function hasCallableSignatures(reflection: DeclarationReflection): boolean {
  const typeDeclaration = getTypeDeclaration(reflection)
  if (typeDeclaration?.children?.length) {
    return false
  }
  return (
    Boolean(reflection.signatures?.length) ||
    Boolean(typeDeclaration?.signatures?.length)
  )
}

function collectSignatures(
  reflection: DeclarationReflection,
): SignatureReflection[] {
  return [
    ...(reflection.signatures ?? []),
    ...(getTypeDeclaration(reflection)?.signatures ?? []),
  ]
}

/**
 * Returns the suffix shown after a member name in method-style headings:
 *   - `''`   for non-callable members
 *   - `'()'` for callable members that take no arguments
 *   - `'(...)'` for callable members with one or more parameters in any signature
 */
export function getMemberCallSuffix(
  reflection: DeclarationReflection,
): '' | '()' | '(...)' {
  if (!hasCallableSignatures(reflection)) {
    return ''
  }
  const takesArguments = collectSignatures(reflection).some(
    (signature) => (signature.parameters?.length ?? 0) > 0,
  )
  return takesArguments ? '(...)' : '()'
}

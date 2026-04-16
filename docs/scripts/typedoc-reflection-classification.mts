import {
  type DeclarationReflection,
  type ProjectReflection,
  type Reflection,
  ReflectionKind,
  type SignatureReflection,
  type SomeType,
} from 'typedoc'

const REACT_COMPONENT_TYPE_NAMES = new Set([
  'ComponentType',
  'ExoticComponent',
  'FC',
  'ForwardRefExoticComponent',
  'FunctionComponent',
  'MemoExoticComponent',
  'NamedExoticComponent',
])
const REACT_RENDER_TYPE_NAMES = new Set([
  'Element',
  'JSX.Element',
  'React.JSX.Element',
  'ReactElement',
  'ReactNode',
])
const VIEW_TYPE_NAMES = new Set(['ReactNativeView'])

/**
 * Loose record type for duck-typing across SomeType variants.
 * TypeDoc's SomeType is a large union of classes — these recursive walkers
 * check `.type`, `.typeArguments`, `.types`, `.elements` etc. which exist
 * on different variants. Using Record<string, unknown> lets us probe
 * properties without importing every variant.
 */
type TypeRecord = Record<string, unknown>

function isTypeRecord(value: unknown): value is TypeRecord {
  return value != null && typeof value === 'object'
}

function isReflection(value: unknown): value is Reflection {
  return isTypeRecord(value) && typeof value.kind === 'number' && 'id' in value
}

function isDeclarationReflection(
  reflection: Reflection,
): reflection is DeclarationReflection {
  return 'getAllSignatures' in reflection
}

export function isHybridObjectReference(
  typeReference: SomeType | TypeRecord | null | undefined,
): boolean {
  if (!isTypeRecord(typeReference) || typeReference.type !== 'reference') {
    return false
  }

  if (typeReference.name === 'HybridObject') {
    return true
  }

  const target = typeReference.target
  if (!isTypeRecord(target)) {
    return false
  }

  if (target.qualifiedName !== 'HybridObject') {
    return false
  }

  if (target.packageName == null) {
    return true
  }

  return target.packageName === 'react-native-nitro-modules'
}

function getTypeReferenceNames(
  typeReference: SomeType | TypeRecord | null | undefined,
): string[] {
  if (!isTypeRecord(typeReference) || typeReference.type !== 'reference') {
    return []
  }

  const names = new Set<string>()
  if (typeof typeReference.name === 'string' && typeReference.name.length > 0) {
    names.add(typeReference.name)
  }

  if (
    typeof typeReference.qualifiedName === 'string' &&
    typeReference.qualifiedName.length > 0
  ) {
    names.add(typeReference.qualifiedName)
  }

  const target = typeReference.target
  if (isTypeRecord(target)) {
    if (
      typeof target.qualifiedName === 'string' &&
      target.qualifiedName.length > 0
    ) {
      names.add(target.qualifiedName)
    }
  }

  return [...names]
}

function referenceHasTypeName(
  typeReference: SomeType | TypeRecord,
  names: Set<string>,
): boolean {
  for (const candidate of getTypeReferenceNames(typeReference)) {
    if (typeof candidate !== 'string') {
      continue
    }

    const normalized = candidate.startsWith('React.')
      ? candidate.slice('React.'.length)
      : candidate

    if (names.has(candidate) || names.has(normalized)) {
      return true
    }
  }

  return false
}

function typeContainsViewSignal(
  type: unknown,
  visited = new Set<object>(),
): boolean {
  if (!isTypeRecord(type)) {
    return false
  }

  if (visited.has(type)) {
    return false
  }
  visited.add(type)

  if (type.type === 'reference') {
    if (referenceHasTypeName(type, VIEW_TYPE_NAMES)) {
      return true
    }

    if (referenceHasTypeName(type, REACT_COMPONENT_TYPE_NAMES)) {
      return true
    }

    if (referenceHasTypeName(type, REACT_RENDER_TYPE_NAMES)) {
      return true
    }

    if (Array.isArray(type.typeArguments)) {
      for (const typeArgument of type.typeArguments) {
        if (typeContainsViewSignal(typeArgument, visited)) {
          return true
        }
      }
    }

    return false
  }

  if (type.type === 'reflection') {
    const declaration = type.declaration
    if (isTypeRecord(declaration)) {
      if (Array.isArray(declaration.signatures)) {
        for (const signature of declaration.signatures) {
          if (isTypeRecord(signature)) {
            if (typeContainsViewSignal(signature.type, visited)) {
              return true
            }
          }
        }
      }

      if (Array.isArray(declaration.children)) {
        for (const child of declaration.children) {
          if (isTypeRecord(child)) {
            if (typeContainsViewSignal(child.type, visited)) {
              return true
            }
          }
        }
      }
    }
  }

  if (Array.isArray(type.types)) {
    for (const childType of type.types) {
      if (typeContainsViewSignal(childType, visited)) {
        return true
      }
    }
  }

  if (Array.isArray(type.elements)) {
    for (const childType of type.elements) {
      if (typeContainsViewSignal(childType, visited)) {
        return true
      }
    }
  }

  if (
    type.elementType != null &&
    typeContainsViewSignal(type.elementType, visited)
  ) {
    return true
  }

  if (type.target != null && typeContainsViewSignal(type.target, visited)) {
    return true
  }

  return false
}

function typeContainsCallSignature(
  type: unknown,
  visited = new Set<object>(),
): boolean {
  if (!isTypeRecord(type)) {
    return false
  }

  if (visited.has(type)) {
    return false
  }
  visited.add(type)

  if (type.type === 'reflection') {
    const declaration = type.declaration
    if (isTypeRecord(declaration)) {
      if (
        Array.isArray(declaration.signatures) &&
        declaration.signatures.length > 0
      ) {
        return true
      }
    }
  }

  if (type.type === 'reference' && Array.isArray(type.typeArguments)) {
    for (const typeArgument of type.typeArguments) {
      if (typeContainsCallSignature(typeArgument, visited)) {
        return true
      }
    }
  }

  if (Array.isArray(type.types)) {
    for (const childType of type.types) {
      if (typeContainsCallSignature(childType, visited)) {
        return true
      }
    }
  }

  if (Array.isArray(type.elements)) {
    for (const childType of type.elements) {
      if (typeContainsCallSignature(childType, visited)) {
        return true
      }
    }
  }

  if (
    type.elementType != null &&
    typeContainsCallSignature(type.elementType, visited)
  ) {
    return true
  }

  return false
}

export function isViewVariableReflection(
  reflection: Reflection | null | undefined,
): boolean {
  if (reflection == null || reflection.kind !== ReflectionKind.Variable) {
    return false
  }
  if (!isDeclarationReflection(reflection)) {
    return false
  }
  return typeContainsViewSignal(reflection.type)
}

function signaturesReturnView(
  signatures: SignatureReflection[] | undefined,
): boolean {
  if (!Array.isArray(signatures) || signatures.length === 0) {
    return false
  }

  return signatures.some((signature) => typeContainsViewSignal(signature?.type))
}

export function isViewFunctionReflection(
  reflection: Reflection | null | undefined,
): boolean {
  if (reflection == null || reflection.kind !== ReflectionKind.Function) {
    return false
  }
  if (!isDeclarationReflection(reflection)) {
    return false
  }
  return signaturesReturnView(reflection.signatures)
}

export function isCallableVariableReflection(
  reflection: Reflection | null | undefined,
): boolean {
  if (reflection == null || reflection.kind !== ReflectionKind.Variable) {
    return false
  }
  if (!isDeclarationReflection(reflection)) {
    return false
  }
  return (
    !isViewVariableReflection(reflection) &&
    typeContainsCallSignature(reflection.type)
  )
}

function getExtendedTypeParentReflection(
  extendedType: SomeType | TypeRecord | null | undefined,
  project: ProjectReflection,
): Reflection | null {
  if (!isTypeRecord(extendedType)) {
    return null
  }

  const reflection = extendedType.reflection
  if (isReflection(reflection)) {
    return reflection
  }

  if (typeof extendedType.target === 'number') {
    return project.getReflectionById(extendedType.target) ?? null
  }

  return null
}

export function createHybridInterfaceResolver(
  project: ProjectReflection,
): (reflection: Reflection | null | undefined) => boolean {
  const memoById = new Map<number, boolean>()
  const memoByReference = new WeakMap<object, boolean>()
  const visitingIds = new Set<number>()
  const visitingReferences = new WeakSet<object>()

  function isHybridInterface(
    reflection: Reflection | null | undefined,
  ): boolean {
    if (reflection == null || typeof reflection !== 'object') {
      return false
    }

    if (reflection.kind !== ReflectionKind.Interface) {
      return false
    }

    if (typeof reflection.id === 'number') {
      if (memoById.has(reflection.id)) {
        return memoById.get(reflection.id) === true
      }

      if (visitingIds.has(reflection.id)) {
        return false
      }
      visitingIds.add(reflection.id)
    } else {
      if (memoByReference.has(reflection)) {
        return memoByReference.get(reflection) === true
      }

      if (visitingReferences.has(reflection)) {
        return false
      }
      visitingReferences.add(reflection)
    }

    const extendedTypes = isDeclarationReflection(reflection)
      ? (reflection.extendedTypes ?? [])
      : []
    let value = false

    for (const extendedType of extendedTypes) {
      if (isHybridObjectReference(extendedType)) {
        value = true
        break
      }

      const parentReflection = getExtendedTypeParentReflection(
        extendedType,
        project,
      )
      if (isHybridInterface(parentReflection)) {
        value = true
        break
      }
    }

    if (typeof reflection.id === 'number') {
      memoById.set(reflection.id, value)
      visitingIds.delete(reflection.id)
    } else {
      memoByReference.set(reflection, value)
      visitingReferences.delete(reflection)
    }

    return value
  }

  return isHybridInterface
}

export function getDirectHybridParentName(
  reflection: Reflection | null | undefined,
  project: ProjectReflection,
  isHybridInterface: (r: Reflection | null | undefined) => boolean,
): string | null {
  if (
    reflection == null ||
    reflection.kind !== ReflectionKind.Interface ||
    !isDeclarationReflection(reflection) ||
    !Array.isArray(reflection.extendedTypes) ||
    !isHybridInterface(reflection)
  ) {
    return null
  }

  for (const extendedType of reflection.extendedTypes) {
    const parentReflection = getExtendedTypeParentReflection(
      extendedType,
      project,
    )
    if (!isHybridInterface(parentReflection)) {
      continue
    }

    if (
      parentReflection != null &&
      parentReflection.name.length > 0 &&
      parentReflection.name !== reflection.name
    ) {
      return parentReflection.name
    }
  }

  return null
}

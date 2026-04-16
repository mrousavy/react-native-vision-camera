import { describe, expect, test } from 'bun:test'
import { ReflectionKind } from 'typedoc'
import {
  setHasOwnTypeLevelDocs,
  shouldSuppressInheritedTypeLevelComment,
} from './inherited-type-level-comments'

function createComment({ hasPlatformTag = false } = {}) {
  return {
    getTags(tagName: string) {
      if (hasPlatformTag && tagName === '@platform') {
        return [{}]
      }

      return []
    },
  }
}

function createInterfaceReflection(overrides: Record<string, unknown> = {}) {
  return {
    kind: ReflectionKind.Interface,
    comment: createComment(),
    extendedTypes: [],
    ...overrides,
  }
}

describe('inherited type-level comments', () => {
  test('keeps child summaries when the child has its own JSDoc', () => {
    const parent = createInterfaceReflection()
    const child = createInterfaceReflection({
      extendedTypes: [{ reflection: parent }],
    })

    setHasOwnTypeLevelDocs(child, true)

    expect(
      shouldSuppressInheritedTypeLevelComment(child, {
        reflections: {},
      } as never),
    ).toBe(false)
  })

  test('suppresses duplicated inherited summaries when the child has no own JSDoc', () => {
    const parent = createInterfaceReflection()
    const child = createInterfaceReflection({
      extendedTypes: [{ reflection: parent }],
    })

    setHasOwnTypeLevelDocs(child, false)

    expect(
      shouldSuppressInheritedTypeLevelComment(child, {
        reflections: {},
      } as never),
    ).toBe(true)
  })

  test('preserves platform-only child comments', () => {
    const parent = createInterfaceReflection()
    const child = createInterfaceReflection({
      comment: createComment({ hasPlatformTag: true }),
      extendedTypes: [{ reflection: parent }],
    })

    setHasOwnTypeLevelDocs(child, false)

    expect(
      shouldSuppressInheritedTypeLevelComment(child, {
        reflections: {},
      } as never),
    ).toBe(false)
  })

  test('treats missing parents or comments as no-ops', () => {
    const withoutParent = createInterfaceReflection()
    const withoutComment = createInterfaceReflection({
      comment: undefined,
      extendedTypes: [{ reflection: createInterfaceReflection() }],
    })

    setHasOwnTypeLevelDocs(withoutParent, false)
    setHasOwnTypeLevelDocs(withoutComment, false)

    expect(
      shouldSuppressInheritedTypeLevelComment(withoutParent, {
        reflections: {},
      } as never),
    ).toBe(false)
    expect(
      shouldSuppressInheritedTypeLevelComment(withoutComment, {
        reflections: {},
      } as never),
    ).toBe(false)
  })
})

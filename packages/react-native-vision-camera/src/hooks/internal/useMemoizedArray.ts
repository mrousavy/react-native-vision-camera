import { useMemo } from 'react'

/**
 * Shallow-memoizes an array by flattening out
 * the useMemo `deps` to {@linkcode maxComparisonLength}.
 */
export function useMemoizedArray<T>(
  array: T[],
  maxComparisonLength: number = 10,
): T[] {
  if (array.length >= maxComparisonLength) {
    throw new Error(
      `useMemoizedArray: Array's length (${array.length}) is greater than maxComparisonLength (${maxComparisonLength})! Cannot compare dependencies. Increase maxComparisonLength to a greater static value, and try again.`,
    )
  }

  return useMemo(
    () => array,
    // biome-ignore lint/correctness/useExhaustiveDependencies: We flatten out the array as dependencies. Cursed magic.
    [...Array(maxComparisonLength).fill(0)].map((_, i) => array[i]),
  )
}

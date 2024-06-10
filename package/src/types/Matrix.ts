// Creates an array of the given specific length
type BuildArray<Length extends number, Element = unknown, Arr extends unknown[] = []> = Arr['length'] extends Length
  ? Arr
  : BuildArray<Length, Element, [...Arr, Element]>

/**
 * Represents a Matrix of the given size
 */
export type Matrix<Rows extends number, Columns extends number> = BuildArray<Rows, BuildArray<Columns, number>>

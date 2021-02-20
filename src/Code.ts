/**
 * Available code types
 */
export type CodeType =
  | 'cat-body'
  | 'dog-body'
  | 'human-body'
  | 'salient-object'
  | 'aztec'
  | 'code-128'
  | 'code-39'
  | 'code-39-mod-43'
  | 'code-93'
  | 'data-matrix'
  | 'ean-13'
  | 'ean-8'
  | 'face'
  | 'interleaved-2-of-5'
  | 'itf-14'
  | 'pdf-417'
  | 'qr'
  | 'upce';

/**
 * Represents a File in the local filesystem.
 */
export type Code = Readonly<{
  /**
   * The decoded string representation of the code.
   */
  code?: string;
  /**
   * The type of the code.
   */
  type: CodeType;
  /**
   * The position of the code relative to the camera's bounds
   */
  bounds: {
    /**
     * Returns the smallest value for the x-coordinate of the rectangle.
     */
    minX: number;
    /**
     * Returns the smallest value for the y-coordinate of the rectangle.
     */
    minY: number;
    /**
     * Returns the largest value of the x-coordinate for the rectangle.
     */
    maxX: number;
    /**
     * Returns the largest value of the y-coordinate for the rectangle.
     */
    maxY: number;
    /**
     * Returns the width of a rectangle.
     */
    width: number;
    /**
     * Returns the height of a rectangle.
     */
    height: number;
  };
}>;

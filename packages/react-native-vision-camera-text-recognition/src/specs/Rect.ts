/**
 * Represents a Rectangle in the current context's
 * coordinate system.
 */
export interface Rect {
  /**
   * The left value (min X) of the Rectangle.
   */
  left: number
  /**
   * The right value (max X) of the Rectangle.
   */
  right: number
  /**
   * The top value (min Y) of the Rectangle.
   */
  top: number
  /**
   * The bottom value (max Y) of the Rectangle.
   */
  bottom: number
}

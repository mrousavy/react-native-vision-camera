import type { Point } from './Point'
import type { Rect } from './Rect'

/**
 * Represents a single recognized text element.
 */
export interface TextElement {
  /**
   * The recognized text.
   */
  text: string
  /**
   * The bounding box relative to the input Frame's coordinates.
   */
  boundingBox: Rect
  /**
   * The corner points relative to the input Frame's coordinates.
   */
  cornerPoints: Point[]
  /**
   * The BCP-47 language codes recognized for this element.
   */
  recognizedLanguages: string[]
}

/**
 * Represents a recognized line of text.
 */
export interface TextLine {
  /**
   * The recognized text.
   */
  text: string
  /**
   * The bounding box relative to the input Frame's coordinates.
   */
  boundingBox: Rect
  /**
   * The corner points relative to the input Frame's coordinates.
   */
  cornerPoints: Point[]
  /**
   * The BCP-47 language codes recognized for this line.
   */
  recognizedLanguages: string[]
  /**
   * The recognized elements inside this line.
   */
  elements: TextElement[]
}

/**
 * Represents a recognized block of text.
 */
export interface TextBlock {
  /**
   * The recognized text.
   */
  text: string
  /**
   * The bounding box relative to the input Frame's coordinates.
   */
  boundingBox: Rect
  /**
   * The corner points relative to the input Frame's coordinates.
   */
  cornerPoints: Point[]
  /**
   * The BCP-47 language codes recognized for this block.
   */
  recognizedLanguages: string[]
  /**
   * The recognized lines inside this block.
   */
  lines: TextLine[]
}

/**
 * Represents all text recognized in a Frame.
 */
export interface RecognizedText {
  /**
   * The complete recognized text.
   */
  text: string
  /**
   * The recognized text blocks.
   */
  blocks: TextBlock[]
}

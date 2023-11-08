import {Point} from './Point';

/**
 * The type of the code to scan.
 */
export type CodeType =
  | 'code-128'
  | 'code-39'
  | 'code-93'
  | 'codabar'
  | 'ean-13'
  | 'ean-8'
  | 'itf'
  | 'upc-e'
  | 'qr'
  | 'pdf-417'
  | 'aztec'
  | 'data-matrix'

/**
 * A scanned frame.
 */
export interface CodeScannerFrame {
  /**
   * The width of the scanned frame
   */
  width: number
  /**
   * The height of the scanned frame
   */
  height: number
}

/**
 * A scanned code.
 */
export interface Code {
  /**
   * The type of the code that was scanned.
   */
  type: CodeType | 'unknown'
  /**
   * The string value, or null if it cannot be decoded.
   */
  value?: string
  /**
   * The location of the code relative to the Camera Preview (in dp).
   */
  frame?: {
    x: number
    y: number
    width: number
    height: number
  }
  /**
   * The location of each corner relative to the Camera Preview (in dp).
   */
  corners?: Point[]
}

/**
 * A scanner for detecting codes in a Camera Stream.
 */
export interface CodeScanner {
  /**
   * The types of codes to configure the code scanner for.
   */
  codeTypes: CodeType[]
  /**
   * A callback to call whenever the scanned codes change.
   */
  onCodeScanned: (codes: Code[], frame: CodeScannerFrame) => void
  /**
   * Crops the scanner's view area to the specific region of interest.
   */
  regionOfInterest?: {
    x: number
    y: number
    width: number
    height: number
  }
}

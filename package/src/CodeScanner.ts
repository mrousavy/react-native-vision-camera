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
  onCodeScanned: (codes: Code[]) => void
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

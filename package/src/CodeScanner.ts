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
  type: CodeType | 'unknown'
  value?: string
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
  codeTypes: CodeType[]
  onCodeScanned: (codes: Code[]) => void
  regionOfInterest?: {
    x: number
    y: number
    width: number
    height: number
  }
}

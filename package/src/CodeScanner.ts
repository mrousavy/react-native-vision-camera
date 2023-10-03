/**
 */
export type CodeType = 'qr' | 'aztec' | 'ean-13'

export interface Code {
  type: CodeType
  value: string
  frame: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface CodeScanner {
  codeTypes: CodeType[]
  onCodeScanned: (codes: Code[]) => void
  regionOfInterest?: {
    x: number
    y: number
    width: number
    height: number
  }
  /**
   * ms
   */
  interval?: number
}

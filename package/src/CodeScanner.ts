export type CodeType = 'qr' | 'barcode'

export interface Code {
  type: CodeType
  frame: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface CodeScanner {
  codeTypes: CodeType[]
  onCodeScanned: (code: Code) => void
}

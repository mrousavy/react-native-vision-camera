export type BarcodeFormat =
  | 'unknown'
  | 'code-128'
  | 'code-39'
  | 'code-93'
  | 'codabar'
  | 'data-matrix'
  | 'ean-13'
  | 'ean-8'
  | 'itf'
  | 'qr-code'
  | 'upc-a'
  | 'upc-e'
  | 'pdf-417'
  | 'aztec'

export type TargetBarcodeFormat =
  | Exclude<BarcodeFormat, 'unknown'>
  | 'all-formats'

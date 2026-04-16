/**
 * Controls the camera buffer resolution used for barcode scanning.
 *
 * - `'preview'`: Prefer preview-sized buffers for lower latency.
 * - `'full'`: Prefer full/highest available buffers for better detail.
 */
export type BarcodeScannerOutputResolution = 'preview' | 'full'

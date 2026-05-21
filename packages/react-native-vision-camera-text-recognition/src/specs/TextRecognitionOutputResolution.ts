/**
 * Controls the camera buffer resolution used for text recognition.
 *
 * - `'preview'`: Prefer preview-sized buffers for lower latency.
 * - `'full'`: Prefer full/highest available buffers for better detail.
 */
export type TextRecognitionOutputResolution = 'preview' | 'full'

/**
 * Represents the container format of a captured Photo.
 */
export type PhotoContainerFormat =
  | 'jpeg'
  | 'heic'
  | 'dng'
  | 'tiff'
  | 'dcm'
  | 'unknown'

/**
 * Represents a {@linkcode PhotoContainerFormat} that
 * can be used to capture Photos in.
 */
export type TargetPhotoContainerFormat =
  | Extract<PhotoContainerFormat, 'jpeg' | 'heic' | 'dng'>
  | 'native'

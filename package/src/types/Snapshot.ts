import type { PhotoFile } from './PhotoFile'

export interface TakeSnapshotOptions {
  /**
   * Specify a quality for the JPEG encoding of the snapshot.
   * @default 100
   */
  quality?: number
}

export type SnapshotFile = Pick<PhotoFile, 'path' | 'width' | 'height' | 'orientation' | 'isMirrored'>

import type { PhotoFile } from './PhotoFile';
export interface TakeSnapshotOptions {
    /**
     * Specify a quality for the JPEG encoding of the snapshot.
     * @default 100
     */
    quality?: number;
    /**
     * A custom `path` where the snapshot will be saved to.
     *
     * This must be a directory, as VisionCamera will generate a unique filename itself.
     * If the given directory does not exist, this method will throw an error.
     *
     * By default, VisionCamera will use the device's temporary directory.
     */
    path?: string;
}
export type SnapshotFile = Pick<PhotoFile, 'path' | 'width' | 'height' | 'orientation' | 'isMirrored'>;
//# sourceMappingURL=Snapshot.d.ts.map
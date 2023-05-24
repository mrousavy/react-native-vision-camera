export interface TakeSnapshotOptions {
    /**
     * Specifies the quality of the JPEG. (0-100, where 100 means best quality (no compression))
     *
     * It is recommended to set this to `90` or even `80`, since the user probably won't notice a difference between `90`/`80` and `100`.
     *
     * @default 100
     */
    quality?: number;
    /**
     * Whether the Flash should be enabled or disabled
     *
     * @default "off"
     */
    flash?: 'on' | 'off';
    /**
     * When set to `true`, metadata reading and mapping will be skipped. ({@linkcode PhotoFile.metadata} will be `null`)
     *
     * This might result in a faster capture, as metadata reading and mapping requires File IO.
     *
     * @default false
     *
     * @platform Android
     */
    skipMetadata?: boolean;
}

import type { AutoFocusSystem, CameraDevice, CameraDeviceFormat, VideoStabilizationMode } from '../types/CameraDevice';
interface Size {
    width: number;
    height: number;
}
export interface FormatFilter {
    /**
     * The target resolution of the video (and frame processor) output pipeline.
     * If no format supports the given resolution, the format closest to this value will be used.
     */
    videoResolution?: Size | 'max';
    /**
     * The target resolution of the photo output pipeline.
     * If no format supports the given resolution, the format closest to this value will be used.
     */
    photoResolution?: Size | 'max';
    /**
     * The target aspect ratio of the video (and preview) output, expressed as a factor: `width / height`.
     * (Note: Cameras are in landscape orientation)
     *
     * In most cases, you want this to be as close to the screen's aspect ratio as possible (usually ~9:16).
     *
     * @example
     * ```ts
     * const screen = Dimensions.get('screen')
     * targetVideoAspectRatio: screen.height / screen.width
     * ```
     */
    videoAspectRatio?: number;
    /**
     * The target aspect ratio of the photo output, expressed as a factor: `width / height`.
     * (Note: Cameras are in landscape orientation)
     *
     * In most cases, you want this to be the same as `targetVideoAspectRatio`, which you often want
     * to be as close to the screen's aspect ratio as possible (usually ~9:16)
     *
     * @example
     * ```ts
     * const screen = Dimensions.get('screen')
     * targetPhotoAspectRatio: screen.height / screen.width
     * ```
     */
    photoAspectRatio?: number;
    /**
     * The target FPS you want to record video at.
     * If the FPS requirements can not be met, the format closest to this value will be used.
     */
    fps?: number | 'max';
    /**
     * The target video stabilization mode you want to use.
     * If no format supports the target video stabilization mode, the best other matching format will be used.
     */
    videoStabilizationMode?: VideoStabilizationMode;
    /**
     * Whether you want to find a format that supports Photo HDR.
     */
    photoHdr?: boolean;
    /**
     * Whether you want to find a format that supports Photo HDR.
     */
    videoHdr?: boolean;
    /**
     * The target ISO value for capturing photos.
     * Higher ISO values tend to capture sharper photos, at the cost of reduced capture speed.
     * Lower ISO values tend to capture photos quicker.
     */
    iso?: number | 'max' | 'min';
    /**
     * The target auto-focus system.
     * While `phase-detection` is generally the best system available,
     * you might want to choose a different auto-focus system.
     */
    autoFocusSystem?: AutoFocusSystem;
}
/**
 * Get the best matching Camera format for the given device that satisfies your requirements using a sorting filter. By default, formats are sorted by highest to lowest resolution.
 *
 * The {@linkcode filters | filters} are ranked by priority, from highest to lowest.
 * This means the first item you pass will have a higher priority than the second, and so on.
 *
 * @param device The Camera Device you're currently using
 * @param filters The filters you want to use. The format that matches your filter the closest will be returned
 * @returns The format that matches your filter the closest.
 *
 * @example
 * ```ts
 * const format = getCameraFormat(device, [
 *   { videoResolution: { width: 3048, height: 2160 } },
 *   { fps: 60 }
 * ])
 * ```
 */
export declare function getCameraFormat(device: CameraDevice, filters: FormatFilter[]): CameraDeviceFormat;
export {};
//# sourceMappingURL=getCameraFormat.d.ts.map
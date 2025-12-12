import type { Orientation } from './Orientation'
import type { TemporaryFile } from './TemporaryFile'

/**
 * Represents a thumbnail image generated from a photo
 */
export interface ThumbnailFile {
  /**
   * The path to the thumbnail file on the local filesystem.
   */
  path: string
  /**
   * The width of the thumbnail, in pixels.
   */
  width: number
  /**
   * The height of the thumbnail, in pixels.
   */
  height: number
}

/**
 * Configuration for thumbnail generation
 */
export interface ThumbnailOptions {
  /**
   * The size of the thumbnail to generate.
   * If not specified, a default size will be used.
   */
  width: number
  height: number
}

export interface TakePhotoOptions {
  /**
   * Whether the Flash should be enabled or disabled
   *
   * @default "off"
   */
  flash?: 'on' | 'off' | 'auto'
  /**
   * A custom `path` where the photo will be saved to.
   *
   * This must be a directory, as VisionCamera will generate a unique filename itself.
   * If the given directory does not exist, this method will throw an error.
   *
   * By default, VisionCamera will use the device's temporary directory.
   */
  path?: string
  /**
   * Specifies whether red-eye reduction should be applied automatically on flash captures.
   *
   * @platform iOS
   * @default false
   */
  enableAutoRedEyeReduction?: boolean
  /**
   * Specifies whether the photo output should use content aware distortion correction on this photo request.
   * For example, the algorithm may not apply correction to faces in the center of a photo, but may apply it to faces near the photo’s edges.
   *
   * @platform iOS
   * @default false
   */
  enableAutoDistortionCorrection?: boolean
  /**
   * Whether to play the default shutter "click" sound when taking a picture or not.
   *
   * @default true
   */
  enableShutterSound?: boolean
  /**
   * The size of the thumbnail to generate alongside the photo.
   * If specified, a thumbnail will be generated and the `onThumbnailReady` callback will be invoked.
   *
   * **Platform implementations:**
   * - **iOS**: Uses the embedded thumbnail from the camera capture if available for maximum performance
   * - **Android**: Uses memory-efficient downsampling with hardware-accelerated decoding
   *
   * Both implementations generate thumbnails asynchronously without blocking the main photo capture.
   */
  thumbnailSize?: ThumbnailOptions
  /**
   * A callback that gets called when the thumbnail is ready, before the full photo is saved to disk.
   * This allows showing a quick preview to the user while the full-resolution photo is still being processed.
   *
   * The thumbnail is generated asynchronously and this callback is typically invoked before `takePhoto()` resolves.
   *
   * **Note:** On iOS, if the device doesn't support embedded thumbnails, this callback may not be invoked.
   * This is rare and only affects very old devices. Android always invokes the callback.
   */
  onThumbnailReady?: (thumbnail: ThumbnailFile) => void
}

/**
 * Represents a Photo taken by the Camera written to the local filesystem.
 *
 * See {@linkcode Camera.takePhoto | Camera.takePhoto()}
 */
export interface PhotoFile extends TemporaryFile {
  /**
   * The width of the photo, in pixels.
   */
  width: number
  /**
   * The height of the photo, in pixels.
   */
  height: number
  /**
   * Whether this photo is in RAW format or not.
   */
  isRawPhoto: boolean
  /**
   * Display orientation of the photo, relative to the Camera's sensor orientation.
   *
   * Note that Camera sensors are landscape, so e.g. "portrait" photos will have a value of "landscape-left", etc.
   */
  orientation: Orientation
  /**
   * Whether this photo is mirrored (selfies) or not.
   */
  isMirrored: boolean
  thumbnail?: Record<string, unknown>
  /**
   * Metadata information describing the captured image. (iOS only)
   *
   * @see [AVCapturePhoto.metadata](https://developer.apple.com/documentation/avfoundation/avcapturephoto/2873982-metadata)
   *
   * @platform iOS
   */
  metadata?: {
    /**
     * Orientation of the EXIF Image.
     *
     * * 1 = 0 degrees: the correct orientation, no adjustment is required.
     * * 2 = 0 degrees, mirrored: image has been flipped back-to-front.
     * * 3 = 180 degrees: image is upside down.
     * * 4 = 180 degrees, mirrored: image has been flipped back-to-front and is upside down.
     * * 5 = 90 degrees: image has been flipped back-to-front and is on its side.
     * * 6 = 90 degrees, mirrored: image is on its side.
     * * 7 = 270 degrees: image has been flipped back-to-front and is on its far side.
     * * 8 = 270 degrees, mirrored: image is on its far side.
     */
    Orientation: number
    /**
     * @platform iOS
     */
    DPIHeight: number
    /**
     * @platform iOS
     */
    DPIWidth: number
    /**
     * Represents any data Apple cameras write to the metadata
     *
     * @platform iOS
     */
    '{MakerApple}'?: Record<string, unknown>
    '{TIFF}': {
      ResolutionUnit: number
      Software: string
      Make: string
      DateTime: string
      XResolution: number
      /**
       * @platform iOS
       */
      HostComputer?: string
      Model: string
      YResolution: number
    }
    '{Exif}': {
      DateTimeOriginal: string
      ExposureTime: number
      FNumber: number
      LensSpecification: number[]
      ExposureBiasValue: number
      ColorSpace: number
      FocalLenIn35mmFilm: number
      BrightnessValue: number
      ExposureMode: number
      LensModel: string
      SceneType: number
      PixelXDimension: number
      ShutterSpeedValue: number
      SensingMethod: number
      SubjectArea: number[]
      ApertureValue: number
      SubsecTimeDigitized: string
      FocalLength: number
      LensMake: string
      SubsecTimeOriginal: string
      OffsetTimeDigitized: string
      PixelYDimension: number
      ISOSpeedRatings: number[]
      WhiteBalance: number
      DateTimeDigitized: string
      OffsetTimeOriginal: string
      ExifVersion: string
      OffsetTime: string
      Flash: number
      ExposureProgram: number
      MeteringMode: number
    }
  }
}

import { Orientation } from './Orientation';
import type { TemporaryFile } from './TemporaryFile';

export interface TakePhotoOptions {
  /**
   * Indicates how photo quality should be prioritized against speed.
   *
   * * `"quality"` Indicates that photo quality is paramount, even at the expense of shot-to-shot time
   * * `"balanced"` Indicates that photo quality and speed of delivery are balanced in priority
   * * `"speed"` Indicates that speed of photo delivery is most important, even at the expense of quality
   *
   * @default "balanced"
   */
  qualityPrioritization?: 'quality' | 'balanced' | 'speed';
  /**
   * Whether the Flash should be enabled or disabled
   *
   * @default "auto"
   */
  flash?: 'on' | 'off' | 'auto';
  /**
   * Specifies whether red-eye reduction should be applied automatically on flash captures.
   *
   * @default false
   */
  enableAutoRedEyeReduction?: boolean;
  /**
   * Indicates whether still image stabilization will be enabled when capturing the photo
   *
   * @default false
   */
  enableAutoStabilization?: boolean;
  /**
   * Specifies whether the photo output should use content aware distortion correction on this photo request.
   * For example, the algorithm may not apply correction to faces in the center of a photo, but may apply it to faces near the photo’s edges.
   *
   * @platform iOS
   * @default false
   */
  enableAutoDistortionCorrection?: boolean;
  /**
   * Whether to play the default shutter "click" sound when taking a picture or not.
   *
   * @default true
   */
  enableShutterSound?: boolean;
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
  width: number;
  /**
   * The height of the photo, in pixels.
   */
  height: number;
  /**
   * Whether this photo is in RAW format or not.
   */
  isRawPhoto: boolean;
  /**
   * Display orientation of the photo, relative to the Camera's sensor orientation.
   *
   * Note that Camera sensors are landscape, so e.g. "portrait" photos will have a value of "landscape-left", etc.
   */
  orientation: Orientation;
  /**
   * Whether this photo is mirrored (selfies) or not.
   */
  isMirrored: boolean;
  thumbnail?: Record<string, unknown>;
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
    Orientation: number;
    /**
     * @platform iOS
     */
    DPIHeight: number;
    /**
     * @platform iOS
     */
    DPIWidth: number;
    /**
     * Represents any data Apple cameras write to the metadata
     *
     * @platform iOS
     */
    '{MakerApple}'?: Record<string, unknown>;
    '{TIFF}': {
      ResolutionUnit: number;
      Software: string;
      Make: string;
      DateTime: string;
      XResolution: number;
      /**
       * @platform iOS
       */
      HostComputer?: string;
      Model: string;
      YResolution: number;
    };
    '{Exif}': {
      DateTimeOriginal: string;
      ExposureTime: number;
      FNumber: number;
      LensSpecification: number[];
      ExposureBiasValue: number;
      ColorSpace: number;
      FocalLenIn35mmFilm: number;
      BrightnessValue: number;
      ExposureMode: number;
      LensModel: string;
      SceneType: number;
      PixelXDimension: number;
      ShutterSpeedValue: number;
      SensingMethod: number;
      SubjectArea: number[];
      ApertureValue: number;
      SubsecTimeDigitized: string;
      FocalLength: number;
      LensMake: string;
      SubsecTimeOriginal: string;
      OffsetTimeDigitized: string;
      PixelYDimension: number;
      ISOSpeedRatings: number[];
      WhiteBalance: number;
      DateTimeDigitized: string;
      OffsetTimeOriginal: string;
      ExifVersion: string;
      OffsetTime: string;
      Flash: number;
      ExposureProgram: number;
      MeteringMode: number;
    };
  };
}

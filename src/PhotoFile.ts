import type { CameraPhotoCodec } from './CameraCodec';
import type { TemporaryFile } from './TemporaryFile';

export interface TakePhotoOptions {
  /**
   * Specify the photo codec to use. To get a list of available photo codecs use the {@link Camera.getAvailablePhotoCodecs} function.
   *
   * @platform iOS
   * @default undefined
   */
  photoCodec?: CameraPhotoCodec;
  /**
   * Indicates how photo quality should be prioritized against speed.
   *
   * * `"quality"` Indicates that speed of photo delivery is most important, even at the expense of quality
   * * `"balanced"` Indicates that photo quality and speed of delivery are balanced in priority
   * * `"speed"` Indicates that photo quality is paramount, even at the expense of shot-to-shot time
   *
   * @platform iOS 13.0+
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
   * Specifies whether a virtual multi-cam device should capture images from all containing physical cameras
   * to create a combined, higher quality image.
   *
   * @see [`isAutoVirtualDeviceFusionEnabled`](https://developer.apple.com/documentation/avfoundation/avcapturephotosettings/3192192-isautovirtualdevicefusionenabled)
   */
  enableVirtualDeviceFusion?: boolean;
  /**
   * Indicates whether still image stabilization will be employed when capturing the photo
   *
   * @default false
   */
  enableAutoStabilization?: boolean;
  /**
   * Specifies whether the photo output should use content aware distortion correction on this photo request (at its discretion).
   *
   * @default false
   */
  enableAutoDistortionCorrection?: boolean;
  /**
   * When set to `true`, metadata reading and mapping will be skipped. ({@link PhotoFile.metadata} will be null)
   *
   * This might result in a faster capture, as metadata reading and mapping requires File IO.
   *
   * @default false
   *
   * @platform Android
   */
  skipMetadata?: boolean;
}

/**
 * Represents a Photo taken by the Camera written to the local filesystem.
 *
 * Related: {@link Camera.takePhoto}, {@link Camera.takeSnapshot}
 */
export interface PhotoFile extends TemporaryFile {
  width: number;
  height: number;
  isRawPhoto: boolean;
  thumbnail?: Record<string, unknown>;
  metadata: {
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

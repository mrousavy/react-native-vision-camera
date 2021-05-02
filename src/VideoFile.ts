// /**
//  * not yet implemented.
//  */
// declare interface RecordVideoOptions<TCodec extends CameraVideoCodec> {
//   /**
//    * Specify the video codec to use. To get a list of available video codecs use the `getAvailableVideoCodecs()` function.
//    *
//    * @default undefined
//    */
//   videoCodec?: TCodec;
//   /**
//    * Specify the average video bitrate in bits per second. (H.264 only)
//    */
//   bitrate?: TCodec extends "h264" ? number : never;
//   /**
//    * Specify the video quality. (`0.0` - `1.0`, where `1.0` means 100% quality. JPEG, HEIC and Apple ProRAW only. With HEIC and Apple ProRAW, 1.0 indicates lossless compression)
//    */
//   quality?: TCodec extends "jpeg" | "hevc" | "hevc-alpha" ? number : never;
//   /**
//    * Maximum number of frames per interval, `1` specifies to only use key frames. (H.264 only)
//    */
//   maxKeyFrameInterval?: TCodec extends "h264" ? number : never;
//   /**
//    * Maximum duration of a key frame interval in seconds, where as `0.0` means no limit. (H.264 only)
//    */
//   maxKeyFrameIntervalDuration?: TCodec extends "h264" ? number : never;
// }

import type { CameraCaptureError } from './CameraError';
import type { TemporaryFile } from './TemporaryFile';

export type VideoFileType = 'mov' | 'avci' | 'heic' | 'heif' | 'm4v' | 'mp4';

/**
 * Represents the Format in which the AssetWriter encodes the Image Buffer in.
 *
 * * `420v`: [`kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange`](https://developer.apple.com/documentation/corevideo/1563591-pixel_format_identifiers/kcvpixelformattype_420ypcbcr8biplanarvideorange)
 * * `420f`: [`kCVPixelFormatType_420YpCbCr8BiPlanarFullRange`](https://developer.apple.com/documentation/corevideo/1563591-pixel_format_identifiers/kcvpixelformattype_420ypcbcr8biplanarfullrange)
 * * `a2vy`: [`kCVPixelFormatType_422YpCbCr_4A_8BiPlanar`](https://developer.apple.com/documentation/corevideo/1563591-pixel_format_identifiers/kcvpixelformattype_422ypcbcr_4a_8biplanar)
 * * `422v`: [`kCVPixelFormatType_422YpCbCr8BiPlanarVideoRange`](https://developer.apple.com/documentation/corevideo/1563591-pixel_format_identifiers/kcvpixelformattype_422ypcbcr8biplanarvideorange)
 * * `422f`: [`kCVPixelFormatType_422YpCbCr8BiPlanarFullRange`](https://developer.apple.com/documentation/corevideo/1563591-pixel_format_identifiers/kcvpixelformattype_422ypcbcr8biplanarfullrange)
 * * `444v`: [`kCVPixelFormatType_444YpCbCr8BiPlanarVideoRange`](https://developer.apple.com/documentation/corevideo/1563591-pixel_format_identifiers/kcvpixelformattype_444ypcbcr8biplanarvideorange)
 * * `444f`: [`kCVPixelFormatType_444YpCbCr8BiPlanarFullRange`](https://developer.apple.com/documentation/corevideo/1563591-pixel_format_identifiers/kcvpixelformattype_444ypcbcr8biplanarfullrange)
 */
export type PixelFormat = '420v' | '420f' | 'a2vy' | '422v' | '422f' | '444v' | '444f';

export interface RecordVideoOptions {
  /**
   * Set the video flash mode. Natively, this just enables the torch while recording.
   */
  flash?: 'on' | 'off' | 'auto';
  /**
   * Sets the file type to use for the Video Recording.
   * @default "mov"
   */
  fileType?: VideoFileType;
  /**
   * Specifies the Pixel Format to use for the Image Buffer encoding. (See [`videoSettings`](https://developer.apple.com/documentation/avfoundation/avcapturevideodataoutput/1389945-videosettings) for more information)
   * @default "420v"
   */
  pixelFormat?: PixelFormat;
  /**
   * Called when there was an unexpected runtime error while recording the video.
   */
  onRecordingError: (error: CameraCaptureError) => void;
  /**
   * Called when the recording has been successfully saved to file.
   */
  onRecordingFinished: (video: VideoFile) => void;
}

/**
 * Represents a Video taken by the Camera written to the local filesystem.
 *
 * Related: {@linkcode Camera.startRecording | Camera.startRecording()}, {@linkcode Camera.stopRecording | Camera.stopRecording()}
 */
export interface VideoFile extends TemporaryFile {
  /**
   * Represents the duration of the video, in seconds.
   *
   * This is `undefined` on Android, see [issue #77](https://github.com/cuvent/react-native-vision-camera/issues/77)
   *
   * @platform iOS
   */
  duration?: number;
}

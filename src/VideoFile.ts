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

import type { CameraCaptureError } from "./CameraError";
import type { TemporaryFile } from "./TemporaryFile";

export interface RecordVideoOptions {
  /**
   * Set the video flash mode. Natively, this just enables the torch while recording.
   */
  flash?: "on" | "off" | "auto";
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
 */
export type VideoFile = Readonly<
  TemporaryFile & {
    /**
     * Represents the duration of the video, in seconds.
     */
    duration: number;
    /**
     * Represents the file size of the recorded Video File, in bytes.
     */
    size: number;
  }
>;

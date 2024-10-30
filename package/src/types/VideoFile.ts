import type { CameraCaptureError } from '../CameraError'
import type { TemporaryFile } from './TemporaryFile'

export interface RecordVideoOptions {
  /**
   * Set the video flash mode. Natively, this just enables the torch while recording.
   */
  flash?: 'on' | 'off'
  /**
   * Specifies the output file type to record videos into.
   */
  fileType?: 'mov' | 'mp4'
  /**
   * A custom `path` where the video will be saved to.
   *
   * This must be a directory, as VisionCamera will generate a unique filename itself.
   * If the given directory does not exist, this method will throw an error.
   *
   * By default, VisionCamera will use the device's temporary directory.
   */
  path?: string
  /**
   * Called when there was an unexpected runtime error while recording the video.
   */
  onRecordingError: (error: CameraCaptureError) => void
  /**
   * Called when the recording has been successfully saved to file.
   */
  onRecordingFinished: (video: VideoFile) => void
  /**
   * The Video Codec to record in.
   * - `h264`: Widely supported, but might be less efficient, especially with larger sizes or framerates.
   * - `h265`: The HEVC (High-Efficient-Video-Codec) for higher efficient video recordings. Results in up to 50% smaller file-sizes.
   */
  videoCodec?: 'h264' | 'h265'
}

/**
 * Represents a Video taken by the Camera written to the local filesystem.
 *
 * Related: {@linkcode Camera.startRecording | Camera.startRecording()}, {@linkcode Camera.stopRecording | Camera.stopRecording()}
 */
export interface VideoFile extends TemporaryFile {
  /**
   * Represents the duration of the video, in seconds.
   */
  duration: number
  /**
   * The width of the video, in pixels.
   */
  width: number
  /**
   * The height of the video, in pixels.
   */
  height: number
}

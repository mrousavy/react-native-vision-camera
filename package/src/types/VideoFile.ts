import type { CameraCaptureError } from './CameraError'
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
  /**
   * The bit-rate for encoding the video into a file, in Mbps (Megabits per second).
   *
   * Bit-rate is dependant on various factors such as resolution, FPS, pixel format (whether it's 10 bit HDR or not), and video codec.
   *
   * By default, it will be calculated by the hardware encoder, which takes all those factors into account.
   *
   * * `extra-low`: 40% lower than whatever the hardware encoder recommends.
   * * `low`: 20% lower than whatever the hardware encoder recommends.
   * * `normal`: The recommended value by the hardware encoder.
   * * `high`: 20% higher than whatever the hardware encoder recommends.
   * * `extra-high`: 40% higher than whatever the hardware encoder recommends.
   * * `number`: Any custom number for the bit-rate, in Mbps.
   *
   * @default 'normal'
   */
  videoBitRate?: 'extra-low' | 'low' | 'normal' | 'high' | 'extra-high' | number
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

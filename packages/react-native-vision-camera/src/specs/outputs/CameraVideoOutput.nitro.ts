import type { useVideoOutput } from '../../hooks/useVideoOutput'
import type { Size } from '../common-types/Size'
import type { VideoCodec } from '../common-types/VideoCodec'
import type { Location } from '../location/Location.nitro'
import type { CameraSession } from '../session/CameraSession.nitro'
import type { CameraSessionConfig } from '../session/CameraSessionConfig.nitro'
import type { CameraOutput } from './CameraOutput.nitro'
import type { Recorder } from './Recorder.nitro'

// TODO: Make the props in options non-nullable for better performance and just pass false as defaults

/**
 * Configuration options for a {@linkcode CameraVideoOutput}.
 *
 * @see {@linkcode CameraVideoOutput}
 * @see {@linkcode useVideoOutput | useVideoOutput(...)}
 */
export interface VideoOutputOptions {
  /**
   * The target Video Resolution to use.
   *
   * @discussion
   * The {@linkcode CameraSession} will negotiate all
   * output {@linkcode targetResolution}s and constraints (such
   * as HDR, FPS, etc) in a {@linkcode CameraSessionConfig} to
   * finalize the Resolution used for the Output.
   * This is therefore merely a resolution _target_, and may
   * not be exactly met.
   *
   * If the given {@linkcode targetResolution} cannot be met
   * exactly, its aspect ratio (computed by
   * {@linkcode Size.width} / {@linkcode Size.height}) will
   * be prioritized over pixel count.
   */
  targetResolution: Size
  /**
   * Whether to enable, or disable audio in video
   * recordings.
   * By default, no audio is recorded.
   *
   * This requires audio/microphone permission.
   *
   * @default false
   */
  enableAudio?: boolean

  /**
   * If set to `true`, the {@linkcode CameraVideoOutput}
   * will be persistent.
   *
   * A persistent {@linkcode CameraVideoOutput} can continue
   * to record even while switching Cameras.
   *
   * This may require additional processing power,
   * or choose a different (non-fully-native) path
   * for recording, so it is disabled by default.
   *
   * - On iOS, enabling {@linkcode enablePersistentRecorder}
   *   will use a custom [`AVCaptureVideoDataOutput`](https://developer.apple.com/documentation/avfoundation/avcapturevideodataoutput) +
   *   `AVAssetWriter` pipeline instead of the fully internal [`AVCaptureMovieFileOutput`](https://developer.apple.com/documentation/avfoundation/avcapturemoviefileoutput).
   * - On Android, enabling {@linkcode enablePersistentRecorder}
   *   will use [`asPersistentRecording()`](https://developer.android.com/reference/androidx/camera/video/PendingRecording#asPersistentRecording()).
   *
   * @default false
   */
  enablePersistentRecorder?: boolean

  /**
   * If set to `true`, the {@linkcode CameraVideoOutput}
   * supports using higher resolution (and potentially
   * also higher bit-rate and higher frame rate) media codecs
   * to encode video frames to the video container.
   *
   * On Android, this binds to [`VIDEO_CAPABILITIES_SOURCE_CAMCORDER_PROFILE`](https://developer.android.com/reference/kotlin/androidx/camera/video/Recorder#VIDEO_CAPABILITIES_SOURCE_CAMCORDER_PROFILE())
   * if `true`, and [`VIDEO_CAPABILITIES_SOURCE_CAMCORDER_PROFILE`](https://developer.android.com/reference/kotlin/androidx/camera/video/Recorder#VIDEO_CAPABILITIES_SOURCE_CAMCORDER_PROFILE())
   * if set to `false`.
   *
   * In practice, enabling this allows using formats with higher
   * video resolutions, at the risk of higher power usage.
   *
   * As codecs are very device-specific, enabling this may cause
   * instability issues, so use this with caution.
   *
   * @platform Android
   * @default false
   */
  enableHigherResolutionCodecs?: boolean

  /**
   * Specifies the target bit-rate for the
   * {@linkcode CameraVideoOutput}, in bits per second.
   *
   * The encoder may or may not encode with exactly this bit-rate,
   * depending on system pressure, moving pixels, and file size
   * constraints - but it will be taken as reference.
   *
   * @default undefined
   */
  targetBitRate?: number

  /**
   * The container file type for recordings produced by this output.
   *
   * On Android this is always `.mp4` and this field is ignored.
   *
   * @platform iOS
   * @default 'mov'
   */
  fileType?: RecorderFileType
}

/**
 * Container file type for a {@linkcode CameraVideoOutput}'s recordings.
 */
export type RecorderFileType = 'mp4' | 'mov'

/**
 * Output settings for a {@linkcode CameraVideoOutput}.
 *
 * @see {@linkcode CameraVideoOutput}
 * @see {@linkcode CameraVideoOutput.setOutputSettings | CameraVideoOutput.setOutputSettings(...)}
 */
export interface VideoOutputSettings {
  /**
   * Configures the {@linkcode VideoCodec} to use for recording a video.
   * By default, it is `undefined`, and the most efficient codec will
   * be selected (likely {@linkcode VideoCodec | h265})
   */
  codec?: VideoCodec
}

/**
 * Video Recorder settings for a {@linkcode Recorder}
 * created by a {@linkcode CameraVideoOutput}.
 *
 * @see {@linkcode CameraVideoOutput}
 * @see {@linkcode Recorder}
 * @see {@linkcode CameraVideoOutput.createRecorder | CameraVideoOutput.createRecorder(...)}
 */
export interface RecorderSettings {
  /**
   * Sets the given {@linkcode Location} to be embedded
   * into the video metadata using the ISO-6709 standard.
   */
  location?: Location
  /**
   * If set, the recording automatically stops once it reaches
   * this duration, in seconds.
   *
   * When the limit is reached, the recording is finalized
   * successfully, and the `onRecordingFinished` callback
   * passed to {@linkcode Recorder.startRecording | startRecording(...)}
   * is invoked with the resulting file path — the same
   * behavior as calling {@linkcode Recorder.stopRecording | stopRecording()}.
   *
   * @default undefined
   */
  maxDuration?: number
  /**
   * If set, the recording automatically stops once the file
   * reaches this size, in bytes.
   *
   * When the limit is reached, the recording is finalized
   * successfully, and the `onRecordingFinished` callback
   * passed to {@linkcode Recorder.startRecording | startRecording(...)}
   * is invoked with the resulting file path — the same
   * behavior as calling {@linkcode Recorder.stopRecording | stopRecording()}.
   *
   * @default undefined
   */
  maxFileSize?: number
}

/**
 * A Video output allows recording videos (possibly with audio)
 * to a file.
 *
 * @see {@linkcode VideoOutputOptions}
 * @see {@linkcode Recorder}
 * @see {@linkcode useVideoOutput | useVideoOutput(...)}
 * @example
 * ```ts
 * const videoOutput = useVideoOutput({})
 * ```
 */
export interface CameraVideoOutput extends CameraOutput {
  /**
   * Get all supported {@linkcode VideoCodec | VideoCodecs} this
   * {@linkcode CameraVideoOutput} currently can record in.
   *
   * This method must be called after the {@linkcode CameraVideoOutput}
   * has been attached to a Camera Session.
   *
   * @platform iOS
   * @throws This method throws if you call it before this output
   * is attached to a Camera Session (via `configure(...)`)
   */
  getSupportedVideoCodecs(): VideoCodec[]
  /**
   * Set the output settings for this video output.
   * This method must be called after the output has been
   * attached to the Camera Session, and before
   * {@linkcode createRecorder | createRecorder(...)}.
   *
   * @platform iOS
   */
  setOutputSettings(settings: VideoOutputSettings): Promise<void>

  /**
   * Creates and prepares a new {@linkcode Recorder}
   * instance with the given {@linkcode RecorderSettings}.
   *
   * The {@linkcode Recorder} will record to a temporary
   * file, and can only record once.
   *
   * If you want to create a second recording,
   * you must create a new {@linkcode Recorder}.
   */
  createRecorder(settings: RecorderSettings): Promise<Recorder>
}

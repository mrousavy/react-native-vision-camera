import type { HybridObject } from 'react-native-nitro-modules'

export type RecordingFinishedReason =
  | 'stopped'
  | 'max-duration-reached'
  | 'max-file-size-reached'

/**
 * Represents an instance that can record videos to
 * a file.
 *
 * A single {@linkcode Recorder} instance records to a single
 * video file.
 * To record multiple videos, you will need to create
 * multiple {@linkcode Recorder} instances.
 */
export interface Recorder
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * Returns whether the output is currently recording.
   */
  readonly isRecording: boolean
  /**
   * Returns whether the current recording is paused.
   */
  readonly isPaused: boolean
  /**
   * Returns the currently recorded duration, in seconds.
   * If {@linkcode isRecording} is false, this returns `0`.
   */
  readonly recordedDuration: number
  /**
   * Returns the currently recorded file size, in bytes.
   * If {@linkcode isRecording} is false, this returns `0`.
   */
  readonly recordedFileSize: number
  /**
   * Returns the absolute path to the file that this {@linkcode Recorder}
   * is recording- or will record- to.
   */
  readonly filePath: string

  /**
   * Start the Video recording to a temporary file.
   *
   * This Promise resolves once the Recording has been successfully started,
   * and returns the temporary file URL it is currently recording to.
   * @param onRecordingFinished Called when the Recording has successfully finished
   * via a {@linkcode stopRecording | stopRecording()} call, or when the max
   * duration/file-size has been reached. See {@linkcode RecordingFinishedReason}
   * @param onRecordingError Called when an unexpected error occurred while recording.
   * @param onRecordingPaused Called when the recording has been paused.
   * @param onRecordingResumed Called when the paused recording has been resumed.
   * @throws If called twice on the same {@linkcode Recorder} instance.
   */
  startRecording(
    onRecordingFinished: (
      filePath: string,
      reason: RecordingFinishedReason,
    ) => void,
    onRecordingError: (error: Error) => void,
    onRecordingPaused?: () => void,
    onRecordingResumed?: () => void,
  ): Promise<void>

  /**
   * Requests the Video recording to be stopped.
   * Once the recording has actually been stopped,
   * the `onRecordingFinished` callback passed to
   * {@linkcode startRecording} will be called.
   *
   * @throws If the recording is already stopped.
   */
  stopRecording(): Promise<void>
  /**
   * Requests the Video recording to be paused.
   * Once the recording has actually been paused,
   * the `onRecordingPaused` callback passed to
   * {@linkcode startRecording} will be called.
   */
  pauseRecording(): Promise<void>
  /**
   * Requests the currently paused Video recording
   * to be resumed.
   * Once the recording has actually been resumed,
   * the `onRecordingResumed` callback passed to
   * {@linkcode startRecording} will be called.
   */
  resumeRecording(): Promise<void>

  /**
   * Cancels the current recording and deletes
   * the video file.
   */
  cancelRecording(): Promise<void>
}

package com.margelo.nitro.camera.extensions

import androidx.camera.video.VideoRecordEvent

fun VideoRecordEvent.Finalize.getThrowable(): Throwable? {
  if (!this.hasError()) return null

  val errorCode = this.error
  val message =
    when (errorCode) {
      VideoRecordEvent.Finalize.ERROR_NONE -> "ERROR_NONE"
      VideoRecordEvent.Finalize.ERROR_UNKNOWN -> "ERROR_UNKNOWN"
      VideoRecordEvent.Finalize.ERROR_FILE_SIZE_LIMIT_REACHED -> "ERROR_FILE_SIZE_LIMIT_REACHED"
      VideoRecordEvent.Finalize.ERROR_INSUFFICIENT_STORAGE -> "ERROR_INSUFFICIENT_STORAGE"
      VideoRecordEvent.Finalize.ERROR_INVALID_OUTPUT_OPTIONS -> "ERROR_INVALID_OUTPUT_OPTIONS"
      VideoRecordEvent.Finalize.ERROR_ENCODING_FAILED -> "ERROR_ENCODING_FAILED"
      VideoRecordEvent.Finalize.ERROR_RECORDER_ERROR -> "ERROR_RECORDER_ERROR"
      VideoRecordEvent.Finalize.ERROR_NO_VALID_DATA -> "ERROR_NO_VALID_DATA"
      VideoRecordEvent.Finalize.ERROR_SOURCE_INACTIVE -> "ERROR_SOURCE_INACTIVE"
      VideoRecordEvent.Finalize.ERROR_DURATION_LIMIT_REACHED -> "ERROR_DURATION_LIMIT_REACHED"
      VideoRecordEvent.Finalize.ERROR_RECORDING_GARBAGE_COLLECTED -> "ERROR_RECORDING_GARBAGE_COLLECTED"
      else -> "ERROR_UNKNOWN ($errorCode)"
    }
  return Error("Failed to record! $message", this.cause)
}

/**
 * CameraX reports reaching a configured `maxDuration` / `maxFileSize` limit as an
 * error, but the resulting file is still finalized and usable. Callers should
 * treat these as a successful finish.
 */
val VideoRecordEvent.Finalize.isRecoverableLimitReached: Boolean
  get() =
    this.hasError() &&
      (
        this.error == VideoRecordEvent.Finalize.ERROR_DURATION_LIMIT_REACHED ||
          this.error == VideoRecordEvent.Finalize.ERROR_FILE_SIZE_LIMIT_REACHED
      )

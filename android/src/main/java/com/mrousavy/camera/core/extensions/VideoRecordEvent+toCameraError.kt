package com.mrousavy.camera.core.extensions

import androidx.camera.video.VideoRecordEvent
import com.mrousavy.camera.core.DurationLimitReachedError
import com.mrousavy.camera.core.EncoderError
import com.mrousavy.camera.core.FileSizeLimitReachedError
import com.mrousavy.camera.core.InsufficientStorageForRecorderError
import com.mrousavy.camera.core.InvalidRecorderConfigurationError
import com.mrousavy.camera.core.NoDataError
import com.mrousavy.camera.core.RecorderError
import com.mrousavy.camera.core.UnknownRecorderError

fun VideoRecordEvent.Finalize.getCameraError(): RecorderError? {
  if (!hasError()) return null

  return when (error) {
    // errors where the recording still gets saved (so we can probably ignore them)
    VideoRecordEvent.Finalize.ERROR_INSUFFICIENT_STORAGE -> return InsufficientStorageForRecorderError(cause)

    VideoRecordEvent.Finalize.ERROR_SOURCE_INACTIVE -> return NoDataError(cause)

    VideoRecordEvent.Finalize.ERROR_DURATION_LIMIT_REACHED -> return DurationLimitReachedError(cause)

    VideoRecordEvent.Finalize.ERROR_FILE_SIZE_LIMIT_REACHED -> return FileSizeLimitReachedError(cause)

    VideoRecordEvent.Finalize.ERROR_RECORDING_GARBAGE_COLLECTED -> return UnknownRecorderError(true, cause)

    // fatal errors where no recording gets saved
    VideoRecordEvent.Finalize.ERROR_NONE -> return null

    VideoRecordEvent.Finalize.ERROR_UNKNOWN -> return UnknownRecorderError(false, cause)

    VideoRecordEvent.Finalize.ERROR_INVALID_OUTPUT_OPTIONS -> return InvalidRecorderConfigurationError(cause)

    VideoRecordEvent.Finalize.ERROR_ENCODING_FAILED -> return EncoderError(cause)

    VideoRecordEvent.Finalize.ERROR_RECORDER_ERROR -> return UnknownRecorderError(false, cause)

    VideoRecordEvent.Finalize.ERROR_NO_VALID_DATA -> return NoDataError(cause)

    else -> UnknownRecorderError(false, cause)
  }
}

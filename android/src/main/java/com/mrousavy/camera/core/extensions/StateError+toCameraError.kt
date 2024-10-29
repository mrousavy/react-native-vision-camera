package com.mrousavy.camera.core.extensions

import androidx.camera.core.CameraState
import androidx.camera.core.CameraState.StateError
import com.mrousavy.camera.core.CameraError
import com.mrousavy.camera.core.CameraInUseError
import com.mrousavy.camera.core.CameraIsRestrictedError
import com.mrousavy.camera.core.DoNotDisturbBugError
import com.mrousavy.camera.core.FatalCameraError
import com.mrousavy.camera.core.InvalidOutputConfigurationError
import com.mrousavy.camera.core.MaxCamerasInUseError
import com.mrousavy.camera.core.RecoverableError
import com.mrousavy.camera.core.UnknownCameraError

fun StateError.toCameraError(): CameraError =
  when (this.code) {
    CameraState.ERROR_MAX_CAMERAS_IN_USE -> MaxCamerasInUseError(cause)
    CameraState.ERROR_CAMERA_IN_USE -> CameraInUseError(cause)
    CameraState.ERROR_CAMERA_FATAL_ERROR -> FatalCameraError(cause)
    CameraState.ERROR_CAMERA_DISABLED -> CameraIsRestrictedError(cause)
    CameraState.ERROR_DO_NOT_DISTURB_MODE_ENABLED -> DoNotDisturbBugError(cause)
    CameraState.ERROR_OTHER_RECOVERABLE_ERROR -> RecoverableError(cause)
    CameraState.ERROR_STREAM_CONFIG -> InvalidOutputConfigurationError(cause)
    else -> UnknownCameraError(cause)
  }

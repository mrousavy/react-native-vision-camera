package com.mrousavy.camera.core

import android.annotation.SuppressLint
import android.hardware.camera2.CameraMetadata
import android.hardware.camera2.CaptureRequest
import androidx.camera.camera2.interop.Camera2CameraControl
import androidx.camera.camera2.interop.CaptureRequestOptions
import androidx.camera.camera2.interop.ExperimentalCamera2Interop
import androidx.camera.core.CameraControl

@ExperimentalCamera2Interop
@SuppressLint("RestrictedApi")
suspend fun CameraSession.focusDepth(depth: Double) {
  val camera = camera ?: throw CameraNotReadyError()

  try {
    Camera2CameraControl.from(camera.cameraControl).let {
      CaptureRequestOptions.Builder().apply {
        val distance = depth.toFloat()
        setCaptureRequestOption(CaptureRequest.LENS_FOCUS_DISTANCE, distance)
        setCaptureRequestOption(CaptureRequest.CONTROL_AF_MODE, CameraMetadata.CONTROL_AF_MODE_OFF)
      }.let { builder ->
        it.addCaptureRequestOptions(builder.build())
      }
    }
  } catch (e: CameraControl.OperationCanceledException) {
    throw FocusCanceledError()
  }
}

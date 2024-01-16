package com.mrousavy.camera.extensions

import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CaptureFailure
import android.hardware.camera2.CaptureRequest
import android.hardware.camera2.TotalCaptureResult
import android.media.MediaActionSound
import com.mrousavy.camera.core.CameraQueues
import com.mrousavy.camera.core.CaptureAbortedError
import com.mrousavy.camera.core.UnknownCaptureError
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

suspend fun CameraCaptureSession.capture(captureRequest: CaptureRequest, enableShutterSound: Boolean): TotalCaptureResult =
  suspendCoroutine { continuation ->
    val shutterSound = if (enableShutterSound) MediaActionSound() else null
    shutterSound?.load(MediaActionSound.SHUTTER_CLICK)

    this.capture(
      captureRequest,
      object : CameraCaptureSession.CaptureCallback() {
        override fun onCaptureCompleted(session: CameraCaptureSession, request: CaptureRequest, result: TotalCaptureResult) {
          super.onCaptureCompleted(session, request, result)

          continuation.resume(result)
          shutterSound?.release()
        }

        override fun onCaptureStarted(session: CameraCaptureSession, request: CaptureRequest, timestamp: Long, frameNumber: Long) {
          super.onCaptureStarted(session, request, timestamp, frameNumber)

          if (enableShutterSound) {
            shutterSound?.play(MediaActionSound.SHUTTER_CLICK)
          }
        }

        override fun onCaptureFailed(session: CameraCaptureSession, request: CaptureRequest, failure: CaptureFailure) {
          super.onCaptureFailed(session, request, failure)
          val wasImageCaptured = failure.wasImageCaptured()
          val error = when (failure.reason) {
            CaptureFailure.REASON_ERROR -> UnknownCaptureError(wasImageCaptured)
            CaptureFailure.REASON_FLUSHED -> CaptureAbortedError(wasImageCaptured)
            else -> UnknownCaptureError(wasImageCaptured)
          }
          continuation.resumeWithException(error)
        }
      },
      CameraQueues.cameraQueue.handler
    )
  }

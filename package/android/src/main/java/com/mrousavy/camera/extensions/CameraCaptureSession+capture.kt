package com.mrousavy.camera.extensions

import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CaptureFailure
import android.hardware.camera2.CaptureRequest
import android.hardware.camera2.TotalCaptureResult
import android.media.MediaActionSound
import android.util.Log
import com.mrousavy.camera.core.CaptureAbortedError
import com.mrousavy.camera.core.CaptureTimedOutError
import com.mrousavy.camera.core.UnknownCaptureError
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine

private const val TAG = "CameraCaptureSession"

suspend fun CameraCaptureSession.capture(captureRequest: CaptureRequest, enableShutterSound: Boolean): TotalCaptureResult =
  suspendCancellableCoroutine { continuation ->
    val shutterSound = if (enableShutterSound) MediaActionSound() else null
    shutterSound?.load(MediaActionSound.SHUTTER_CLICK)

    CoroutineScope(Dispatchers.Default).launch {
      delay(5000) // after 5s, cancel capture
      if (continuation.isActive) {
        Log.e(TAG, "Capture timed out after 5 seconds!")
        continuation.resumeWithException(CaptureTimedOutError())
        tryAbortCaptures()
      }
    }

    this.capture(
      captureRequest,
      object : CameraCaptureSession.CaptureCallback() {
        override fun onCaptureCompleted(session: CameraCaptureSession, request: CaptureRequest, result: TotalCaptureResult) {
          super.onCaptureCompleted(session, request, result)

          if (request == captureRequest) {
            continuation.resume(result)
            shutterSound?.release()
          }
        }

        override fun onCaptureStarted(session: CameraCaptureSession, request: CaptureRequest, timestamp: Long, frameNumber: Long) {
          super.onCaptureStarted(session, request, timestamp, frameNumber)

          if (request == captureRequest) {
            if (enableShutterSound) {
              shutterSound?.play(MediaActionSound.SHUTTER_CLICK)
            }
          }
        }

        override fun onCaptureFailed(session: CameraCaptureSession, request: CaptureRequest, failure: CaptureFailure) {
          super.onCaptureFailed(session, request, failure)

          if (request == captureRequest) {
            val wasImageCaptured = failure.wasImageCaptured()
            val error = when (failure.reason) {
              CaptureFailure.REASON_ERROR -> UnknownCaptureError(wasImageCaptured)
              CaptureFailure.REASON_FLUSHED -> CaptureAbortedError(wasImageCaptured)
              else -> UnknownCaptureError(wasImageCaptured)
            }
            continuation.resumeWithException(error)
          }
        }
      },
      null
    )
  }

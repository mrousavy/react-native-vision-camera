package com.mrousavy.camera.extensions

import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraCaptureSession.CaptureCallback
import android.hardware.camera2.CaptureRequest
import android.hardware.camera2.CaptureRequest.Builder
import android.hardware.camera2.CaptureRequest.CONTROL_AE_STATE_PRECAPTURE
import android.hardware.camera2.CaptureResult
import android.hardware.camera2.TotalCaptureResult
import android.util.Log
import com.mrousavy.camera.CameraQueues
import com.mrousavy.camera.parsers.Flash
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

suspend fun CameraCaptureSession.triggerFlashAE(flashMode: Flash, repeatingRequestBuilder: Builder) {
  if (flashMode == Flash.OFF) return

  return suspendCancellableCoroutine { continuation ->
    // Start a pre-capture sequence
    repeatingRequestBuilder.set(CaptureRequest.CONTROL_AE_PRECAPTURE_TRIGGER, CaptureRequest.CONTROL_AE_PRECAPTURE_TRIGGER_START)

    capture(repeatingRequestBuilder.build(), object: CaptureCallback() {
      var didStartPrecapture = false

      private fun process(result: CaptureResult) {
        val aeState = result.get(CaptureResult.CONTROL_AE_STATE)
        Log.i("FLASH___", "AE-State: $aeState")
        if (aeState == CONTROL_AE_STATE_PRECAPTURE) {
          if (!didStartPrecapture) {
            // First time this is triggered, it started the precapture. We wait until it finished.
            didStartPrecapture = true
          } else {
            // Second time this is triggered, it finished the precapture.
            continuation.resume(Unit)
          }
        }
      }

      override fun onCaptureProgressed(session: CameraCaptureSession, request: CaptureRequest, partialResult: CaptureResult) {
        super.onCaptureProgressed(session, request, partialResult)
        process(partialResult)
      }

      override fun onCaptureCompleted(session: CameraCaptureSession, request: CaptureRequest, result: TotalCaptureResult) {
        super.onCaptureCompleted(session, request, result)
        process(result)
      }
    }, CameraQueues.cameraQueue.handler)

    // Reset it back to it's default value
    repeatingRequestBuilder.set(CaptureRequest.CONTROL_AE_PRECAPTURE_TRIGGER, CaptureRequest.CONTROL_AE_PRECAPTURE_TRIGGER_IDLE)
  }
}

package com.mrousavy.camera.extensions

import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CaptureFailure
import android.hardware.camera2.CaptureRequest
import android.hardware.camera2.TotalCaptureResult
import com.mrousavy.camera.core.CaptureAbortedError
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * Set a new repeating request for the [CameraCaptureSession], and wait until the first Frame has arrived.
 */
suspend fun CameraCaptureSession.setRepeatingRequestAndWait(request: CaptureRequest) {
  return suspendCancellableCoroutine { continuation ->
    this.setRepeatingRequest(request, object: CameraCaptureSession.CaptureCallback() {
      override fun onCaptureCompleted(session: CameraCaptureSession, request: CaptureRequest, result: TotalCaptureResult) {
        super.onCaptureCompleted(session, request, result)

        if (continuation.isActive) {
          continuation.resume(Unit)
          session.setRepeatingRequest(request, null, null)
        }
      }
      override fun onCaptureFailed(session: CameraCaptureSession, request: CaptureRequest, failure: CaptureFailure) {
        super.onCaptureFailed(session, request, failure)

        if (continuation.isActive) {
          continuation.resumeWithException(CaptureAbortedError(failure.wasImageCaptured()))
          session.setRepeatingRequest(request, null, null)
        }
      }
    }, null)
  }
}

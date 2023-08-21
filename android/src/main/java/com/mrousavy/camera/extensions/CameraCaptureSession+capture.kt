package com.mrousavy.camera.extensions

import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CaptureFailure
import android.hardware.camera2.CaptureRequest
import android.hardware.camera2.TotalCaptureResult
import com.mrousavy.camera.CameraQueues
import com.mrousavy.camera.CaptureAbortedError
import com.mrousavy.camera.UnknownCaptureError
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

suspend fun CameraCaptureSession.capture(captureRequest: CaptureRequest): TotalCaptureResult {
  return suspendCoroutine { continuation ->
    this.capture(captureRequest, object: CameraCaptureSession.CaptureCallback() {
      override fun onCaptureCompleted(
        session: CameraCaptureSession,
        request: CaptureRequest,
        result: TotalCaptureResult
      ) {
        super.onCaptureCompleted(session, request, result)
        continuation.resume(result)
      }

      override fun onCaptureFailed(
        session: CameraCaptureSession,
        request: CaptureRequest,
        failure: CaptureFailure
      ) {
        super.onCaptureFailed(session, request, failure)
        val wasImageCaptured = failure.wasImageCaptured()
        val error = when (failure.reason) {
          CaptureFailure.REASON_ERROR -> UnknownCaptureError(wasImageCaptured)
          CaptureFailure.REASON_FLUSHED -> CaptureAbortedError(wasImageCaptured)
          else -> UnknownCaptureError(wasImageCaptured)
        }
        continuation.resumeWithException(error)
      }
    }, CameraQueues.cameraQueue.handler)
  }
}

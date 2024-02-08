package com.mrousavy.camera.extensions

import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CaptureFailure
import android.hardware.camera2.CaptureRequest
import android.hardware.camera2.CaptureResult
import android.hardware.camera2.TotalCaptureResult
import android.util.Log
import com.mrousavy.camera.core.CaptureAbortedError
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.suspendCancellableCoroutine

private const val TAG = "CameraCaptureSession"

/**
 * Set a new repeating request for the [CameraCaptureSession] that contains an AF trigger, and wait until AF has locked.
 */
suspend fun CameraCaptureSession.setRepeatingRequestAndWaitForAF(request: CaptureRequest) =
  suspendCancellableCoroutine { continuation ->
    this.setRepeatingRequest(
      request,
      object : CameraCaptureSession.CaptureCallback() {
        override fun onCaptureCompleted(session: CameraCaptureSession, request: CaptureRequest, result: TotalCaptureResult) {
          super.onCaptureCompleted(session, request, result)

          if (continuation.isActive) {
            val afState = result.get(CaptureResult.CONTROL_AF_STATE)
            Log.i(TAG, "AF State: $afState")
            if (afState == CaptureResult.CONTROL_AF_STATE_FOCUSED_LOCKED || afState == CaptureResult.CONTROL_AF_STATE_NOT_FOCUSED_LOCKED) {
              continuation.resume(Unit)
              session.setRepeatingRequest(request, null, null)
            }
          }
        }
        override fun onCaptureFailed(session: CameraCaptureSession, request: CaptureRequest, failure: CaptureFailure) {
          super.onCaptureFailed(session, request, failure)

          if (continuation.isActive) {
            continuation.resumeWithException(CaptureAbortedError(failure.wasImageCaptured()))
            session.setRepeatingRequest(request, null, null)
          }
        }
      },
      null
    )
  }

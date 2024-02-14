package com.mrousavy.camera.extensions

import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CaptureFailure
import android.hardware.camera2.CaptureRequest
import android.hardware.camera2.CaptureResult
import android.hardware.camera2.TotalCaptureResult
import android.util.Log
import com.mrousavy.camera.core.CaptureAbortedError
import com.mrousavy.camera.core.CaptureTimedOutError
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.coroutineContext

private const val TAG = "CameraCaptureSession"

enum class PrecaptureTrigger {
  AE,
  AF,
  AWB
}

enum class FocusState {
  Locked,
  NotLocked
}
enum class ExposureState {
  Converged,
  FlashRequired
}

data class ResultState(val focusState: FocusState?, val exposureState: ExposureState?)

/**
 * Set a new repeating request for the [CameraCaptureSession] that contains a precapture trigger, and wait until the given precaptures have locked.
 */
suspend fun CameraCaptureSession.setRepeatingRequestAndWaitForPrecapture(
  request: CaptureRequest,
  vararg precaptureTriggers: PrecaptureTrigger
): ResultState =
  suspendCancellableCoroutine { continuation ->
    // Map<PrecaptureTrigger, Boolean> of all completed precaptures
    val completed = precaptureTriggers.associateWith { false }.toMutableMap()
    var focusState: FocusState? = null
    var exposureState: ExposureState? = null

    CoroutineScope(Dispatchers.Default).launch {
      delay(5000) // after 5s, cancel capture
      if (continuation.isActive) {
        Log.e(TAG, "Precapture timed out after 5 seconds!")
        continuation.resumeWithException(CaptureTimedOutError())
        try {
          setRepeatingRequest(request, null, null)
        } catch (e: Throwable) {
          // session might have already been closed
          Log.e(TAG, "Error resetting session repeating request..", e)
        }
      }
    }

    this.setRepeatingRequest(
      request,
      object : CameraCaptureSession.CaptureCallback() {
        override fun onCaptureCompleted(session: CameraCaptureSession, request: CaptureRequest, result: TotalCaptureResult) {
          super.onCaptureCompleted(session, request, result)

          if (continuation.isActive) {
            // AF Precapture
            if (precaptureTriggers.contains(PrecaptureTrigger.AF)) {
              val afState = result.get(CaptureResult.CONTROL_AF_STATE)
              Log.i(TAG, "AF State: $afState")
              if (afState == CaptureResult.CONTROL_AF_STATE_FOCUSED_LOCKED) {
                focusState = FocusState.Locked
                completed[PrecaptureTrigger.AF] = true
              } else if (afState == CaptureResult.CONTROL_AF_STATE_NOT_FOCUSED_LOCKED) {
                focusState = FocusState.NotLocked
                completed[PrecaptureTrigger.AF] = true
              }
            }
            // AE Precapture
            if (precaptureTriggers.contains(PrecaptureTrigger.AE)) {
              val aeState = result.get(CaptureResult.CONTROL_AE_STATE)
              Log.i(TAG, "AE State: $aeState")
              if (aeState == CaptureResult.CONTROL_AE_STATE_CONVERGED) {
                exposureState = ExposureState.Converged
                completed[PrecaptureTrigger.AE] = true
              } else if (aeState == CaptureResult.CONTROL_AE_STATE_FLASH_REQUIRED) {
                exposureState = ExposureState.FlashRequired
                completed[PrecaptureTrigger.AE] = true
              }
            }
            // AWB Precapture
            if (precaptureTriggers.contains(PrecaptureTrigger.AWB)) {
              val aeState = result.get(CaptureResult.CONTROL_AWB_STATE)
              Log.i(TAG, "AE State: $aeState")
              if (aeState == CaptureResult.CONTROL_AWB_STATE_CONVERGED) {
                completed[PrecaptureTrigger.AWB] = true
              }
            }

            if (completed.values.all { it == true }) {
              // All precaptures did complete!
              continuation.resume(ResultState(focusState, exposureState))
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

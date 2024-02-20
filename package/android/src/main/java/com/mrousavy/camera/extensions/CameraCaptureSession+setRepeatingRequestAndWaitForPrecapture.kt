package com.mrousavy.camera.extensions

import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CaptureFailure
import android.hardware.camera2.CaptureRequest
import android.hardware.camera2.CaptureResult
import android.hardware.camera2.TotalCaptureResult
import android.util.Log
import com.mrousavy.camera.core.CaptureAbortedError
import com.mrousavy.camera.core.CaptureTimedOutError
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine

private const val TAG = "CameraCaptureSession"

enum class PrecaptureTrigger {
  AE,
  AF,
  AWB
}

interface AutoState {
  val isCompleted: Boolean
  val isPassivelyFocused: Boolean
}

enum class FocusState : AutoState {
  Unknown,
  Inactive,
  Scanning,
  Focused,
  Unfocused,
  PassiveScanning,
  PassiveFocused,
  PassiveUnfocused;

  override val isCompleted: Boolean
    get() = this == Focused || this == Unfocused
  override val isPassivelyFocused: Boolean
    get() = this == PassiveFocused

  companion object {
    fun fromAFState(afState: Int): FocusState =
      when (afState) {
        CaptureResult.CONTROL_AF_STATE_INACTIVE -> Inactive
        CaptureResult.CONTROL_AF_STATE_ACTIVE_SCAN -> Scanning
        CaptureResult.CONTROL_AF_STATE_FOCUSED_LOCKED -> Focused
        CaptureResult.CONTROL_AF_STATE_NOT_FOCUSED_LOCKED -> Unfocused
        CaptureResult.CONTROL_AF_STATE_PASSIVE_SCAN -> PassiveScanning
        CaptureResult.CONTROL_AF_STATE_PASSIVE_FOCUSED -> PassiveFocused
        CaptureResult.CONTROL_AF_STATE_PASSIVE_UNFOCUSED -> PassiveUnfocused
        else -> Unknown
      }
  }
}
enum class ExposureState : AutoState {
  Unknown,
  Locked,
  Inactive,
  Precapture,
  Searching,
  Converged,
  FlashRequired;

  override val isCompleted: Boolean
    get() = this == Converged || this == FlashRequired
  override val isPassivelyFocused: Boolean
    get() = this == Converged

  companion object {
    fun fromAEState(aeState: Int): ExposureState =
      when (aeState) {
        CaptureResult.CONTROL_AE_STATE_INACTIVE -> Inactive
        CaptureResult.CONTROL_AE_STATE_SEARCHING -> Searching
        CaptureResult.CONTROL_AE_STATE_PRECAPTURE -> Precapture
        CaptureResult.CONTROL_AE_STATE_CONVERGED -> Converged
        CaptureResult.CONTROL_AE_STATE_FLASH_REQUIRED -> FlashRequired
        CaptureResult.CONTROL_AE_STATE_LOCKED -> Locked
        else -> Unknown
      }
  }
}

enum class WhiteBalanceState : AutoState {
  Unknown,
  Inactive,
  Locked,
  Searching,
  Converged;

  override val isCompleted: Boolean
    get() = this == Converged
  override val isPassivelyFocused: Boolean
    get() = this == Converged

  companion object {
    fun fromAWBState(awbState: Int): WhiteBalanceState =
      when (awbState) {
        CaptureResult.CONTROL_AWB_STATE_INACTIVE -> Inactive
        CaptureResult.CONTROL_AWB_STATE_SEARCHING -> Searching
        CaptureResult.CONTROL_AWB_STATE_CONVERGED -> Converged
        CaptureResult.CONTROL_AWB_STATE_LOCKED -> Locked
        else -> Unknown
      }
  }
}

data class ResultState(val focusState: FocusState, val exposureState: ExposureState, val whiteBalanceState: WhiteBalanceState)

/**
 * Set a new repeating request for the [CameraCaptureSession] that contains a precapture trigger, and wait until the given precaptures have locked.
 */
suspend fun CameraCaptureSession.setRepeatingRequestAndWaitForPrecapture(
  request: CaptureRequest,
  timeoutMs: Long,
  vararg precaptureTriggers: PrecaptureTrigger
): ResultState =
  suspendCancellableCoroutine { continuation ->
    // Map<PrecaptureTrigger, Boolean> of all completed precaptures
    val completed = precaptureTriggers.associateWith { false }.toMutableMap()

    CoroutineScope(Dispatchers.Default).launch {
      delay(timeoutMs) // after timeout, cancel capture
      if (continuation.isActive) {
        Log.e(TAG, "Precapture timed out after ${timeoutMs / 1000} seconds!")
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
            val afState = FocusState.fromAFState(result.get(CaptureResult.CONTROL_AF_STATE) ?: CaptureResult.CONTROL_AF_STATE_INACTIVE)
            val aeState = ExposureState.fromAEState(
              result.get(CaptureResult.CONTROL_AE_STATE) ?: CaptureResult.CONTROL_AE_STATE_INACTIVE
            )
            val awbState = WhiteBalanceState.fromAWBState(
              result.get(CaptureResult.CONTROL_AWB_STATE) ?: CaptureResult.CONTROL_AWB_STATE_INACTIVE
            )
            Log.i(TAG, "Precapture state: AF: $afState, AE: $aeState, AWB: $awbState")

            // AF Precapture
            if (precaptureTriggers.contains(PrecaptureTrigger.AF)) {
              completed[PrecaptureTrigger.AF] = afState.isCompleted
            }
            // AE Precapture
            if (precaptureTriggers.contains(PrecaptureTrigger.AE)) {
              completed[PrecaptureTrigger.AE] = aeState.isCompleted
            }
            // AWB Precapture
            if (precaptureTriggers.contains(PrecaptureTrigger.AWB)) {
              completed[PrecaptureTrigger.AWB] = awbState.isCompleted
            }

            if (completed.values.all { it == true }) {
              // All precaptures did complete!
              continuation.resume(ResultState(afState, aeState, awbState))
              session.setRepeatingRequest(request, null, null)
            }
          }
        }
        override fun onCaptureFailed(session: CameraCaptureSession, request: CaptureRequest, failure: CaptureFailure) {
          super.onCaptureFailed(session, request, failure)

          if (continuation.isActive) {
            // Capture failed or session closed.
            continuation.resumeWithException(CaptureAbortedError(failure.wasImageCaptured()))
            try {
              session.setRepeatingRequest(request, null, null)
            } catch (e: Throwable) {
              Log.e(TAG, "Failed to continue repeating request!", e)
            }
          }
        }
      },
      null
    )
  }

package com.mrousavy.camera.extensions

import android.graphics.Point
import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraMetadata
import android.hardware.camera2.CaptureFailure
import android.hardware.camera2.CaptureRequest
import android.hardware.camera2.TotalCaptureResult
import android.hardware.camera2.params.MeteringRectangle
import android.util.Size
import com.mrousavy.camera.CameraQueues
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

suspend fun CameraCaptureSession.focus(point: Point, cameraCharacteristics: CameraCharacteristics) {
  return suspendCancellableCoroutine { continuation ->
    val weight = MeteringRectangle.METERING_WEIGHT_MAX - 1
    val focusAreaTouch = MeteringRectangle(point, Size(150, 150), weight)

    // Stop any repeating requests
    // TODO: stopRepeating()

    // Cancel any existing AF/focus actions
    val request = device.createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW)
    request.set(CaptureRequest.CONTROL_AF_TRIGGER, CameraMetadata.CONTROL_AF_TRIGGER_CANCEL)
    request.set(CaptureRequest.CONTROL_AF_MODE, CaptureRequest.CONTROL_AF_MODE_OFF)
    capture(request.build(), null, null)


    val tag = Any()

    val captureCallbackHandler = object : CameraCaptureSession.CaptureCallback() {
      override fun onCaptureCompleted(session: CameraCaptureSession, request: CaptureRequest, result: TotalCaptureResult) {
        super.onCaptureCompleted(session, request, result)
        if (request.tag === tag) {
          //the focus trigger is complete -
          //resume repeating (preview surface will get frames), clear AF trigger
          // mPreviewRequestBuilder.set(CaptureRequest.CONTROL_AF_TRIGGER, null)
          // mCameraOps.setRepeatingRequest(mPreviewRequestBuilder.build(), null, null)
          continuation.resume(Unit)
        }
      }

      override fun onCaptureFailed(session: CameraCaptureSession, request: CaptureRequest, failure: CaptureFailure) {
        super.onCaptureFailed(session, request, failure)
        continuation.resumeWithException(Error("Focus failed!"))
        TODO("Use typed error here")
      }
    }

    // Add AF trigger with focus region
    val maxSupportedFocusRegions = cameraCharacteristics.get(CameraCharacteristics.CONTROL_MAX_REGIONS_AE) ?: 0
    if (maxSupportedFocusRegions >= 1) {
      request.set(CaptureRequest.CONTROL_AF_REGIONS, arrayOf(focusAreaTouch))
    }
    request.set(CaptureRequest.CONTROL_MODE, CameraMetadata.CONTROL_MODE_AUTO)
    request.set(CaptureRequest.CONTROL_AF_MODE, CaptureRequest.CONTROL_AF_MODE_AUTO)
    request.set(CaptureRequest.CONTROL_AF_TRIGGER, CameraMetadata.CONTROL_AF_TRIGGER_START)
    request.setTag(tag)

    capture(request.build(), captureCallbackHandler, CameraQueues.cameraQueue.handler)
  }
}

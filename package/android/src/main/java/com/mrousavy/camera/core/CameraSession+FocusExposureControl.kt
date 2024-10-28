package com.mrousavy.camera.core

import android.annotation.SuppressLint
import android.util.Log
import androidx.camera.core.CameraControl
import android.hardware.camera2.CaptureRequest
import androidx.camera.camera2.interop.CaptureRequestOptions
import androidx.camera.core.FocusMeteringAction
import androidx.camera.core.MeteringPoint
import com.mrousavy.camera.core.extensions.await
import androidx.camera.camera2.interop.Camera2CameraControl 

@SuppressLint("RestrictedApi")

// There are a few different focus control modes available in the docs: 
// https://developer.android.com/reference/android/hardware/camera2/CaptureRequest#CONTROL_AF_MODE
// The relevant to us are:
// - CONTROL_AF_MODE_AUTO - allows us to manually tell the camera where to focus
// - CONTROL_AF_MODE_CONTINUOUS_PICTURE - tells the camera to continuously autofocus
fun CameraSession.setFocusMode(mode: Int) {
  val camera = camera ?: throw CameraNotReadyError()

  Camera2CameraControl.from(camera.cameraControl).setCaptureRequestOptions(
    CaptureRequestOptions.Builder().setCaptureRequestOption(CaptureRequest.CONTROL_AF_MODE, mode).build()
  )
  Log.i(CameraSession.TAG, "LP3: set focus mode: ${mode}")  
}

// For exposure we can just set it to be locked
fun CameraSession.setExposureLock(setLocked: Boolean) {
  val camera = camera ?: throw CameraNotReadyError()

  Camera2CameraControl.from(camera.cameraControl).setCaptureRequestOptions(
    CaptureRequestOptions.Builder().setCaptureRequestOption(CaptureRequest.CONTROL_AE_LOCK, setLocked).build()
  )
}

fun CameraSession.setAFTriggerMode(mode: Int) {
  val camera = camera ?: throw CameraNotReadyError()

  Camera2CameraControl.from(camera.cameraControl).setCaptureRequestOptions(
    CaptureRequestOptions.Builder().setCaptureRequestOption(CaptureRequest.CONTROL_AF_TRIGGER, mode).build()
  )
}

fun CameraSession.freeFocusAndExposure() {

  setExposureLock(false)
  setFocusMode(CaptureRequest.CONTROL_AF_MODE_CONTINUOUS_PICTURE)
}

suspend fun CameraSession.lockFocusAndExposureToPoint(meteringPoint: MeteringPoint) {
  val camera = camera ?: throw CameraNotReadyError()

  setFocusMode(CaptureRequest.CONTROL_AF_MODE_AUTO)

  val action = FocusMeteringAction.Builder(meteringPoint).build()
  if (!camera.cameraInfo.isFocusMeteringSupported(action)) {
    throw FocusNotSupportedError()
  }

  try {
    Log.i(CameraSession.TAG, "LP3: Focusing to ${action.meteringPointsAf.joinToString { "(${it.x}, ${it.y})" }}...")
    val future = camera.cameraControl.startFocusAndMetering(action)
    val result = future.await(CameraQueues.cameraExecutor)
    if (result.isFocusSuccessful) {
      Log.i(CameraSession.TAG, "LP3: Focused successfully")
      setExposureLock(true)
    } else {
      Log.i(CameraSession.TAG, "LP3: Failed to focus")
    }
  } catch (e: CameraControl.OperationCanceledException) {
    throw FocusCanceledError()
  }
}

package com.mrousavy.camera.extensions

import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.hardware.camera2.params.OutputConfiguration
import android.hardware.camera2.params.SessionConfiguration
import android.os.Build
import android.util.Log
import com.mrousavy.camera.CameraQueues
import com.mrousavy.camera.CameraSessionCannotBeConfiguredError
import com.mrousavy.camera.core.outputs.CameraOutputs
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.suspendCancellableCoroutine

private const val TAG = "CreateCaptureSession"
private var sessionId = 1000

suspend fun CameraDevice.createCaptureSession(
  cameraManager: CameraManager,
  outputs: CameraOutputs,
  onClosed: (session: CameraCaptureSession) -> Unit,
  queue: CameraQueues.CameraQueue
): CameraCaptureSession =
  suspendCancellableCoroutine { continuation ->
    val characteristics = cameraManager.getCameraCharacteristics(id)
    val hardwareLevel = characteristics.get(CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL)!!
    val sessionId = sessionId++
    Log.i(
      TAG,
      "Camera $id: Creating Capture Session #$sessionId... " +
        "Hardware Level: $hardwareLevel} | Outputs: $outputs"
    )

    val callback = object : CameraCaptureSession.StateCallback() {
      override fun onConfigured(session: CameraCaptureSession) {
        Log.i(TAG, "Camera $id: Capture Session #$sessionId configured!")
        continuation.resume(session)
      }

      override fun onConfigureFailed(session: CameraCaptureSession) {
        Log.e(TAG, "Camera $id: Failed to configure Capture Session #$sessionId!")
        continuation.resumeWithException(CameraSessionCannotBeConfiguredError(id, outputs))
      }

      override fun onClosed(session: CameraCaptureSession) {
        super.onClosed(session)
        Log.i(TAG, "Camera $id: Capture Session #$sessionId closed!")
        onClosed(session)
      }
    }

    val outputConfigurations = arrayListOf<OutputConfiguration>()
    outputs.previewOutput?.let { output ->
      outputConfigurations.add(output.toOutputConfiguration(characteristics))
    }
    outputs.photoOutput?.let { output ->
      outputConfigurations.add(output.toOutputConfiguration(characteristics))
    }
    outputs.videoOutput?.let { output ->
      outputConfigurations.add(output.toOutputConfiguration(characteristics))
    }
    outputs.codeScannerOutput?.let { output ->
      outputConfigurations.add(output.toOutputConfiguration(characteristics))
    }
    if (outputs.enableHdr == true && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      val supportedProfiles = characteristics.get(CameraCharacteristics.REQUEST_AVAILABLE_DYNAMIC_RANGE_PROFILES)
      val hdrProfile = supportedProfiles?.bestProfile ?: supportedProfiles?.supportedProfiles?.firstOrNull()
      if (hdrProfile != null) {
        Log.i(TAG, "Camera $id: Using HDR Profile $hdrProfile...")
        outputConfigurations.forEach { it.dynamicRangeProfile = hdrProfile }
      } else {
        Log.w(TAG, "Camera $id: HDR was enabled, but the device does not support any matching HDR profile!")
      }
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      Log.i(TAG, "Using new API (>=28)")
      val config = SessionConfiguration(SessionConfiguration.SESSION_REGULAR, outputConfigurations, queue.executor, callback)
      this.createCaptureSession(config)
    } else {
      Log.i(TAG, "Using legacy API (<28)")
      this.createCaptureSessionByOutputConfigurations(outputConfigurations, callback, queue.handler)
    }
  }

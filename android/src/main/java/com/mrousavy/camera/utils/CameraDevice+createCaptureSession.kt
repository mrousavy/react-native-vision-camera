package com.mrousavy.camera.utils

import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.hardware.camera2.params.OutputConfiguration
import android.hardware.camera2.params.SessionConfiguration
import android.os.Build
import android.util.Log
import android.view.Surface
import com.mrousavy.camera.CameraQueues
import com.mrousavy.camera.CameraView
import com.mrousavy.camera.parsers.parseHardwareLevel
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

enum class SessionType {
  REGULAR,
  HIGH_SPEED;

  fun toSessionType(): Int {
    // TODO: Use actual enum when we are on API Level 28
    return when(this) {
      REGULAR -> 0 /* CameraDevice.SESSION_OPERATION_MODE_NORMAL */
      HIGH_SPEED -> 1 /* CameraDevice.SESSION_OPERATION_MODE_CONSTRAINED_HIGH_SPEED */
    }
  }
}

enum class OutputType {
  PHOTO,
  VIDEO,
  PREVIEW,
  VIDEO_AND_PREVIEW;

  fun toOutputType(): Long {
    // TODO: Use actual enum when we are on API Level 28
    return when(this) {
      PHOTO -> 0x2 /* CameraMetadata.SCALER_AVAILABLE_STREAM_USE_CASES_STILL_CAPTURE */
      VIDEO -> 0x3 /* CameraMetadata.SCALER_AVAILABLE_STREAM_USE_CASES_VIDEO_RECORD */
      PREVIEW -> 0x1 /* CameraMetadata.SCALER_AVAILABLE_STREAM_USE_CASES_PREVIEW */
      VIDEO_AND_PREVIEW -> 0x4 /* CameraMetadata.SCALER_AVAILABLE_STREAM_USE_CASES_PREVIEW_VIDEO_STILL */
    }
  }
}

data class SurfaceOutput(val surface: Surface,
                         val isMirrored: Boolean = false,
                         val outputType: OutputType? = null,
                         val dynamicRangeProfile: Long? = null) {
  val isRepeating: Boolean
    get() = outputType == OutputType.VIDEO || outputType == OutputType.PREVIEW || outputType == OutputType.VIDEO_AND_PREVIEW
}

fun supportsOutputType(characteristics: CameraCharacteristics, outputType: OutputType): Boolean {
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    val availableUseCases = characteristics.get(CameraCharacteristics.SCALER_AVAILABLE_STREAM_USE_CASES)
    if (availableUseCases != null) {
      if (availableUseCases.contains(outputType.toOutputType())) {
        return true
      }
    }
  }
  val hardwareLevel = characteristics.get(CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL)!!
  if (hardwareLevel == CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_3 || hardwareLevel == CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_FULL) {
    return true
  }

  return false
}

suspend fun CameraDevice.createCaptureSession(cameraManager: CameraManager, sessionType: SessionType, outputs: List<SurfaceOutput>, queue: CameraQueues.CameraQueue): CameraCaptureSession {
  return suspendCoroutine { continuation ->

    val callback = object : CameraCaptureSession.StateCallback() {
      override fun onConfigured(session: CameraCaptureSession) {
        continuation.resume(session)
      }

      override fun onConfigureFailed(session: CameraCaptureSession) {
        continuation.resumeWithException(RuntimeException("Failed to configure the Camera Session!"))
      }
    }

    val characteristics = cameraManager.getCameraCharacteristics(this.id)
    val hardwareLevel = characteristics.get(CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL)!!
    Log.i(CameraView.TAG, "Creating Capture Session on ${parseHardwareLevel(hardwareLevel)} device...")

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      val outputConfigurations = outputs.map {
        val result = OutputConfiguration(it.surface)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
          if (it.isMirrored) result.mirrorMode = OutputConfiguration.MIRROR_MODE_H
          if (it.dynamicRangeProfile != null) result.dynamicRangeProfile = it.dynamicRangeProfile
          if (it.outputType != null && supportsOutputType(characteristics, it.outputType)) {
            result.streamUseCase = it.outputType.toOutputType()
          }
        }
        return@map result
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        // API >28
        val config = SessionConfiguration(sessionType.toSessionType(), outputConfigurations, queue.executor, callback)
        this.createCaptureSession(config)
      } else {
        // API >24
        this.createCaptureSessionByOutputConfigurations(outputConfigurations, callback, queue.handler)
      }
    } else {
      // API <23
      this.createCaptureSession(outputs.map { it.surface }, callback, queue.handler)
    }
  }
}

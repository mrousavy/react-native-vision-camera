package com.mrousavy.camera.parsers

import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.params.OutputConfiguration
import android.hardware.camera2.params.SessionConfiguration
import android.os.Build
import android.view.Surface
import com.mrousavy.camera.CameraQueues
import java.util.concurrent.Executor
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

data class SurfaceOutput(val surface: Surface,
                         val isMirrored: Boolean = false,
                         val streamUseCase: Long? = null,
                         val dynamicRangeProfile: Long? = null)

enum class SessionType {
  REGULAR,
  HIGH_SPEED,
  VENDOR;

  fun toSessionType(): Int {
    // TODO: Use actual enum when we are on API Level 28
    return when(this) {
      REGULAR -> 0 /* CameraDevice.SESSION_OPERATION_MODE_NORMAL */
      HIGH_SPEED -> 1 /* CameraDevice.SESSION_OPERATION_MODE_CONSTRAINED_HIGH_SPEED */
      VENDOR -> 0x8000 /* CameraDevice.SESSION_OPERATION_MODE_VENDOR_START */
    }
  }
}

suspend fun CameraDevice.createCaptureSession(sessionType: SessionType, outputs: List<SurfaceOutput>, queue: CameraQueues.CameraQueue): CameraCaptureSession {
  return suspendCoroutine { continuation ->

    val callback = object : CameraCaptureSession.StateCallback() {
      override fun onConfigured(session: CameraCaptureSession) {
        continuation.resume(session)
      }

      override fun onConfigureFailed(session: CameraCaptureSession) {
        continuation.resumeWithException(RuntimeException("Failed to configure the Camera Session!"))
      }
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      val outputConfigurations = outputs.map {
        val result = OutputConfiguration(it.surface)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
          if (it.isMirrored) result.mirrorMode = OutputConfiguration.MIRROR_MODE_H
          if (it.dynamicRangeProfile != null) result.dynamicRangeProfile = it.dynamicRangeProfile
          if (it.streamUseCase != null) result.streamUseCase = it.streamUseCase
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

package com.mrousavy.camera.core

import android.graphics.Point
import android.hardware.camera2.CameraAccessException
import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CaptureRequest
import android.hardware.camera2.TotalCaptureResult
import android.hardware.camera2.params.MeteringRectangle
import android.util.Log
import android.util.Size
import com.mrousavy.camera.core.capture.PhotoCaptureRequest
import com.mrousavy.camera.core.capture.RepeatingCaptureRequest
import com.mrousavy.camera.core.outputs.SurfaceOutput
import com.mrousavy.camera.extensions.capture
import com.mrousavy.camera.extensions.createCaptureSession
import com.mrousavy.camera.extensions.isValid
import com.mrousavy.camera.extensions.openCamera
import com.mrousavy.camera.extensions.setRepeatingRequestAndWaitForAF
import com.mrousavy.camera.extensions.tryAbortCaptures
import com.mrousavy.camera.types.Flash
import com.mrousavy.camera.types.Orientation
import com.mrousavy.camera.types.QualityPrioritization
import java.io.Closeable
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

/**
 * A [CameraCaptureSession] wrapper that safely handles interruptions and remains open whenever available.
 *
 * This class aims to be similar to Apple's `AVCaptureSession`.
 */
class PersistentCameraCaptureSession(private val cameraManager: CameraManager, private val callback: Callback) : Closeable {
  companion object {
    private const val TAG = "PersistentCameraCaptureSession"
    private val DEFAULT_METERING_SIZE = Size(100, 100)
    private const val FOCUS_RESET_TIMEOUT = 3000L
  }

  // Inputs/Dependencies
  private var cameraId: String? = null
  private var outputs: List<SurfaceOutput> = emptyList()
  private var repeatingRequest: RepeatingCaptureRequest? = null
  private var isActive = false

  // State/Dependants
  private var device: CameraDevice? = null // depends on [cameraId]
  private var session: CameraCaptureSession? = null // depends on [device, surfaceOutputs]
  private var cameraDeviceDetails: CameraDeviceDetails? = null // depends on [device]

  private val mutex = Mutex()
  private var didDestroyFromOutside = false
  private var focusResetJob: Job? = null
  private val coroutineScope = CoroutineScope(CameraQueues.cameraQueue.coroutineDispatcher)

  val isRunning: Boolean
    get() = isActive && session != null && device != null && !didDestroyFromOutside

  override fun close() {
    session?.tryAbortCaptures()
    device?.close()
  }

  private fun assertLocked(method: String) {
    if (!mutex.isLocked) {
      throw SessionIsNotLockedError("Failed to call $method, session is not locked! Call beginConfiguration() first.")
    }
  }

  suspend fun withConfiguration(block: suspend () -> Unit) {
    mutex.withLock {
      block()
      configure()
    }
  }

  fun setInput(cameraId: String) {
    Log.d(TAG, "--> setInput($cameraId)")
    assertLocked("setInput")
    if (this.cameraId != cameraId || device?.id != cameraId) {
      this.cameraId = cameraId

      // Abort any captures in the session so we get the onCaptureFailed handler for any outstanding photos
      session?.tryAbortCaptures()
      session = null
      // Closing the device will also close the session above - even faster than manually closing it.
      device?.close()
      device = null
    }
  }

  fun setOutputs(outputs: List<SurfaceOutput>) {
    Log.d(TAG, "--> setOutputs($outputs)")
    assertLocked("setOutputs")
    if (this.outputs != outputs) {
      this.outputs = outputs

      if (outputs.isNotEmpty()) {
        // Outputs have changed to something else, we don't wanna destroy the session directly
        // so the outputs can be kept warm. The session that gets created next will take over the outputs.
        session?.tryAbortCaptures()
      } else {
        // Just stop it, we don't have any outputs
        session?.close()
      }
      session = null
    }
  }

  fun setRepeatingRequest(request: RepeatingCaptureRequest) {
    assertLocked("setRepeatingRequest")
    Log.d(TAG, "--> setRepeatingRequest(...)")
    if (this.repeatingRequest != request) {
      this.repeatingRequest = request
    }
  }

  fun setIsActive(isActive: Boolean) {
    assertLocked("setIsActive")
    Log.d(TAG, "--> setIsActive($isActive)")
    if (this.isActive != isActive) {
      this.isActive = isActive
    }
    if (isActive && didDestroyFromOutside) {
      didDestroyFromOutside = false
    }
  }

  suspend fun capture(
    qualityPrioritization: QualityPrioritization,
    flash: Flash,
    enableRedEyeReduction: Boolean,
    enableAutoStabilization: Boolean,
    enablePhotoHdr: Boolean,
    orientation: Orientation,
    enableShutterSound: Boolean
  ): TotalCaptureResult {
    mutex.withLock {
      Log.i(TAG, "Capturing photo...")
      val session = session ?: throw CameraNotReadyError()
      val repeatingRequest = repeatingRequest ?: throw CameraNotReadyError()
      val photoRequest = PhotoCaptureRequest(
        repeatingRequest,
        qualityPrioritization,
        flash,
        enableRedEyeReduction,
        enableAutoStabilization,
        enablePhotoHdr,
        orientation
      )
      val device = session.device
      val deviceDetails = getOrCreateCameraDeviceDetails(device)

      // Submit a single high-res capture to photo output as well as all preview outputs
      val outputs = outputs
      val request = photoRequest.createCaptureRequest(device, deviceDetails, outputs)
      return session.capture(request.build(), enableShutterSound)
    }
  }

  suspend fun focus(point: Point) {
    mutex.withLock {
      Log.i(TAG, "Focusing to $point...")
      val session = session ?: throw CameraNotReadyError()
      val repeatingRequest = repeatingRequest ?: throw CameraNotReadyError()
      val device = session.device
      val deviceDetails = getOrCreateCameraDeviceDetails(device)
      if (!deviceDetails.supportsTapToFocus) {
        throw FocusNotSupportedError()
      }
      val outputs = outputs.filter { it.isRepeating }
      val meteringRectangle = MeteringRectangle(point, DEFAULT_METERING_SIZE, MeteringRectangle.METERING_WEIGHT_MAX - 1)

      // 0. Cancel the 3 second focus reset task
      focusResetJob?.cancelAndJoin()
      focusResetJob = null

      // 1. Cancel any ongoing AF/AE/AWB request
      repeatingRequest.createCaptureRequest(device, deviceDetails, outputs).also { request ->
        if (deviceDetails.supportsTapToFocus) {
          request.set(CaptureRequest.CONTROL_AF_TRIGGER, CaptureRequest.CONTROL_AF_TRIGGER_CANCEL)
        }
        if (deviceDetails.supportsTapToExposure) {
          request.set(CaptureRequest.CONTROL_AE_PRECAPTURE_TRIGGER, CaptureRequest.CONTROL_AE_PRECAPTURE_TRIGGER_CANCEL)
        }
        session.capture(request.build(), null, null)
      }

      // 2. After previous AF/AE/AWB requests have been canceled, start a new AF/AE/AWB request
      repeatingRequest.createCaptureRequest(device, deviceDetails, outputs).also { request ->
        request.set(CaptureRequest.CONTROL_MODE, CaptureRequest.CONTROL_MODE_AUTO)
        if (deviceDetails.supportsTapToFocus) {
          request.set(CaptureRequest.CONTROL_AF_MODE, CaptureRequest.CONTROL_AF_MODE_AUTO)
          request.set(CaptureRequest.CONTROL_AF_REGIONS, arrayOf(meteringRectangle))
          request.set(CaptureRequest.CONTROL_AF_TRIGGER, CaptureRequest.CONTROL_AF_TRIGGER_START)
        }
        if (deviceDetails.supportsTapToExposure) {
          request.set(CaptureRequest.CONTROL_AE_REGIONS, arrayOf(meteringRectangle))
          request.set(CaptureRequest.CONTROL_AE_PRECAPTURE_TRIGGER, CaptureRequest.CONTROL_AE_PRECAPTURE_TRIGGER_START)
        }
        if (deviceDetails.supportsTapToWhiteBalance) {
          request.set(CaptureRequest.CONTROL_AWB_REGIONS, arrayOf(meteringRectangle))
        }
        session.capture(request.build(), null, null)

        // 3. Start a repeating request without the trigger and wait until AF/AE/AWB locks
        request.set(CaptureRequest.CONTROL_AF_TRIGGER, null)
        request.set(CaptureRequest.CONTROL_AE_PRECAPTURE_TRIGGER, null)
        session.setRepeatingRequestAndWaitForAF(request.build())
      }

      // 4. After the Camera has successfully found the AF/AE/AWB lock-point, we set it to idle and keep the point metered
      repeatingRequest.createCaptureRequest(device, deviceDetails, outputs).also { request ->
        request.set(CaptureRequest.CONTROL_MODE, CaptureRequest.CONTROL_MODE_AUTO)
        if (deviceDetails.supportsTapToFocus) {
          request.set(CaptureRequest.CONTROL_AF_MODE, CaptureRequest.CONTROL_AF_MODE_AUTO)
          request.set(CaptureRequest.CONTROL_AF_REGIONS, arrayOf(meteringRectangle))
          request.set(CaptureRequest.CONTROL_AF_TRIGGER, CaptureRequest.CONTROL_AF_TRIGGER_IDLE)
        }
        if (deviceDetails.supportsTapToExposure) {
          request.set(CaptureRequest.CONTROL_AE_REGIONS, arrayOf(meteringRectangle))
          request.set(CaptureRequest.CONTROL_AE_PRECAPTURE_TRIGGER, CaptureRequest.CONTROL_AE_PRECAPTURE_TRIGGER_IDLE)
        }
        session.setRepeatingRequest(request.build(), null, null)
      }

      // 5. Wait 3 seconds
      focusResetJob = coroutineScope.launch {
        delay(FOCUS_RESET_TIMEOUT)
        if (!this.isActive) {
          // this job got canceled from the outside
          return@launch
        }
        if (!isRunning || this@PersistentCameraCaptureSession.session != session) {
          // the view/session has already been destroyed in the meantime
          return@launch
        }
        Log.i(TAG, "Resetting focus to auto-focus...")
        // 6. Reset AF/AE/AWB to continuous auto-focus again, which is the default here.
        repeatingRequest.createCaptureRequest(device, deviceDetails, outputs).also { request ->
          session.setRepeatingRequest(request.build(), null, null)
        }
      }
    }
  }

  fun getActiveDeviceDetails(): CameraDeviceDetails? {
    val device = device ?: return null
    return getOrCreateCameraDeviceDetails(device)
  }

  private suspend fun configure() {
    if (didDestroyFromOutside && !isActive) {
      Log.d(TAG, "CameraCaptureSession has been destroyed by Android, skipping configuration until isActive is set to `true` again.")
      return
    }
    Log.d(TAG, "Configure() with isActive: $isActive, ID: $cameraId, device: $device, session: $session")
    val cameraId = cameraId ?: throw NoCameraDeviceError()
    val repeatingRequest = repeatingRequest ?: throw CameraNotReadyError()
    val outputs = outputs

    try {
      didDestroyFromOutside = false

      val device = getOrCreateDevice(cameraId)
      if (didDestroyFromOutside) return

      if (outputs.isEmpty()) return
      val session = getOrCreateSession(device, outputs)
      if (didDestroyFromOutside) return

      if (isActive) {
        Log.d(TAG, "Updating repeating request...")
        val details = getOrCreateCameraDeviceDetails(device)
        val repeatingOutputs = outputs.filter { it.isRepeating }
        val builder = repeatingRequest.createCaptureRequest(device, details, repeatingOutputs)
        session.setRepeatingRequest(builder.build(), null, null)
      } else {
        session.stopRepeating()
        Log.d(TAG, "Stopping repeating request...")
      }
      Log.d(TAG, "Configure() done! isActive: $isActive, ID: $cameraId, device: $device, session: $session")
    } catch (e: CameraAccessException) {
      if (didDestroyFromOutside) {
        // Camera device has been destroyed in the meantime, that's fine.
        Log.d(TAG, "Configure() canceled, session has been destroyed in the meantime!")
      } else {
        // Camera should still be active, so not sure what went wrong. Rethrow
        throw e
      }
    }
  }

  private suspend fun getOrCreateDevice(cameraId: String): CameraDevice {
    val currentDevice = device
    if (currentDevice?.id == cameraId && currentDevice.isValid) {
      return currentDevice
    }

    this.session?.tryAbortCaptures()
    this.device?.close()
    this.device = null
    this.session = null

    Log.i(TAG, "Creating new device...")
    val newDevice = cameraManager.openCamera(cameraId, { device, error ->
      Log.i(TAG, "Camera $device closed!")
      if (this.device == device) {
        this.didDestroyFromOutside = true
        this.session?.tryAbortCaptures()
        this.session = null
        this.device = null
        this.isActive = false
      }
      if (error != null) {
        callback.onError(error)
      }
    }, CameraQueues.videoQueue)
    this.device = newDevice
    return newDevice
  }

  private suspend fun getOrCreateSession(device: CameraDevice, outputs: List<SurfaceOutput>): CameraCaptureSession {
    val currentSession = session
    if (currentSession?.device == device) {
      return currentSession
    }

    if (outputs.isEmpty()) throw NoOutputsError()

    Log.i(TAG, "Creating new session...")
    val newSession = device.createCaptureSession(cameraManager, outputs, { session ->
      Log.i(TAG, "Session $session closed!")
      if (this.session == session) {
        this.didDestroyFromOutside = true
        this.session?.tryAbortCaptures()
        this.session = null
        this.isActive = false
      }
    }, CameraQueues.videoQueue)
    session = newSession
    return newSession
  }

  private fun getOrCreateCameraDeviceDetails(device: CameraDevice): CameraDeviceDetails {
    val currentDetails = cameraDeviceDetails
    if (currentDetails?.cameraId == device.id) {
      return currentDetails
    }

    val newDetails = CameraDeviceDetails(cameraManager, device.id)
    cameraDeviceDetails = newDetails
    return newDetails
  }

  interface Callback {
    fun onError(error: Throwable)
  }

  class SessionIsNotLockedError(message: String) : Error(message)
}

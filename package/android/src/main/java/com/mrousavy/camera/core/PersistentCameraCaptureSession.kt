package com.mrousavy.camera.core

import android.graphics.Point
import android.hardware.camera2.CameraAccessException
import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CaptureRequest
import android.hardware.camera2.TotalCaptureResult
import android.util.Log
import com.mrousavy.camera.core.capture.PhotoCaptureRequest
import com.mrousavy.camera.core.capture.RepeatingCaptureRequest
import com.mrousavy.camera.core.outputs.SurfaceOutput
import com.mrousavy.camera.extensions.PrecaptureOptions
import com.mrousavy.camera.extensions.PrecaptureTrigger
import com.mrousavy.camera.extensions.capture
import com.mrousavy.camera.extensions.createCaptureSession
import com.mrousavy.camera.extensions.isValid
import com.mrousavy.camera.extensions.openCamera
import com.mrousavy.camera.extensions.precapture
import com.mrousavy.camera.extensions.tryAbortCaptures
import com.mrousavy.camera.extensions.tryStopRepeating
import com.mrousavy.camera.types.Flash
import com.mrousavy.camera.types.Orientation
import com.mrousavy.camera.types.QualityPrioritization
import java.io.Closeable
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.coroutineScope
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
    private const val FOCUS_RESET_TIMEOUT = 3000L
    private const val PRECAPTURE_LOCK_TIMEOUT = 5000L
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
  private var focusJob: Job? = null
  private val coroutineScope = CoroutineScope(CameraQueues.cameraQueue.coroutineDispatcher)

  val isRunning: Boolean
    get() = isActive && session != null && device != null && !didDestroyFromOutside

  override fun close() {
    focusJob?.cancel()
    session?.tryAbortCaptures()
    device?.close()
  }

  private fun assertLocked(method: String) {
    if (!mutex.isLocked) {
      throw SessionIsNotLockedError("Failed to call $method, session is not locked! Call beginConfiguration() first.")
    }
  }

  suspend fun withConfiguration(block: suspend () -> Unit) {
    // Cancel any ongoing focus jobs
    focusJob?.cancel()
    focusJob = null

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
    enableAutoStabilization: Boolean,
    enablePhotoHdr: Boolean,
    orientation: Orientation,
    enableShutterSound: Boolean,
    enablePrecapture: Boolean
  ): TotalCaptureResult {
    // Cancel any ongoing focus jobs
    focusJob?.cancel()
    focusJob = null

    mutex.withLock {
      Log.i(TAG, "Capturing photo...")
      val session = session ?: throw CameraNotReadyError()
      val repeatingRequest = repeatingRequest ?: throw CameraNotReadyError()
      val photoRequest = PhotoCaptureRequest(
        repeatingRequest,
        qualityPrioritization,
        enableAutoStabilization,
        enablePhotoHdr,
        orientation
      )
      val device = session.device
      val deviceDetails = getOrCreateCameraDeviceDetails(device)

      // Submit a single high-res capture to photo output as well as all preview outputs
      val outputs = outputs
      val repeatingOutputs = outputs.filter { it.isRepeating }

      val skipPrecapture = !enablePrecapture || qualityPrioritization == QualityPrioritization.SPEED
      if (skipPrecapture && flash == Flash.OFF) {
        // 0. We want to take a picture as fast as possible, so skip any precapture sequence and just capture one Frame.
        Log.i(TAG, "Using fast capture path without pre-capture sequence...")
        val singleRequest = photoRequest.createCaptureRequest(device, deviceDetails, outputs)
        return session.capture(singleRequest.build(), enableShutterSound)
      }

      Log.i(TAG, "Locking AF/AE/AWB...")

      // 1. Run precapture sequence
      var needsFlash: Boolean
      try {
        val precaptureRequest = repeatingRequest.createCaptureRequest(device, deviceDetails, repeatingOutputs)
        val skipIfPassivelyFocused = flash == Flash.OFF
        val options = PrecaptureOptions(
          listOf(PrecaptureTrigger.AF, PrecaptureTrigger.AE, PrecaptureTrigger.AWB),
          flash,
          emptyList(),
          skipIfPassivelyFocused,
          PRECAPTURE_LOCK_TIMEOUT
        )
        val result = session.precapture(precaptureRequest, deviceDetails, options)
        needsFlash = result.needsFlash
      } catch (e: CaptureTimedOutError) {
        // the precapture just timed out after 5 seconds, take picture anyways without focus.
        needsFlash = false
      } catch (e: FocusCanceledError) {
        throw CaptureAbortedError(false)
      }

      try {
        // 2. Once precapture AF/AE/AWB successfully locked, capture the actual photo
        val singleRequest = photoRequest.createCaptureRequest(device, deviceDetails, outputs)
        if (needsFlash) {
          singleRequest.set(CaptureRequest.CONTROL_AE_MODE, CaptureRequest.CONTROL_AE_MODE_ON)
          singleRequest.set(CaptureRequest.FLASH_MODE, CaptureRequest.FLASH_MODE_SINGLE)
        }
        return session.capture(singleRequest.build(), enableShutterSound)
      } finally {
        // 3. After taking a photo we set the repeating request back to idle to remove the AE/AF/AWB locks again
        val idleRequest = repeatingRequest.createCaptureRequest(device, deviceDetails, repeatingOutputs)
        session.setRepeatingRequest(idleRequest.build(), null, null)
      }
    }
  }

  suspend fun focus(point: Point) {
    // Cancel any previous focus jobs
    focusJob?.cancel()
    focusJob = null

    mutex.withLock {
      Log.i(TAG, "Focusing to $point...")
      val session = session ?: throw CameraNotReadyError()
      val repeatingRequest = repeatingRequest ?: throw CameraNotReadyError()
      val device = session.device
      val deviceDetails = getOrCreateCameraDeviceDetails(device)
      if (!deviceDetails.supportsFocusRegions) {
        throw FocusNotSupportedError()
      }
      val outputs = outputs.filter { it.isRepeating }

      // 1. Run a precapture sequence for AF, AE and AWB.
      focusJob = coroutineScope.launch {
        val request = repeatingRequest.createCaptureRequest(device, deviceDetails, outputs)
        val options =
          PrecaptureOptions(listOf(PrecaptureTrigger.AF, PrecaptureTrigger.AE), Flash.OFF, listOf(point), false, FOCUS_RESET_TIMEOUT)
        session.precapture(request, deviceDetails, options)
      }
      focusJob?.join()

      // 2. Reset AF/AE/AWB again after 3 seconds timeout
      focusJob = coroutineScope.launch {
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
        Log.d(TAG, "Stopping repeating request...")
        session.tryStopRepeating()
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

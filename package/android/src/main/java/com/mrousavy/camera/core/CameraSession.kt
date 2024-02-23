package com.mrousavy.camera.core

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.hardware.camera2.TotalCaptureResult
import android.media.Image
import android.util.Log
import android.util.Range
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LifecycleRegistry
import com.google.mlkit.vision.barcode.common.Barcode
import com.mrousavy.camera.core.outputs.BarcodeScannerOutput
import com.mrousavy.camera.core.outputs.PhotoOutput
import com.mrousavy.camera.core.outputs.VideoPipelineOutput
import com.mrousavy.camera.extensions.await
import com.mrousavy.camera.extensions.byId
import com.mrousavy.camera.frameprocessor.Frame
import com.mrousavy.camera.types.Flash
import com.mrousavy.camera.types.Orientation
import com.mrousavy.camera.types.QualityPrioritization
import com.mrousavy.camera.types.RecordVideoOptions
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.io.Closeable

class CameraSession(private val context: Context, private val cameraManager: CameraManager, private val callback: Callback) :
  Closeable, LifecycleOwner {
  companion object {
    private const val TAG = "CameraSession"
  }

  // Camera Configuration
  private var configuration: CameraConfiguration? = null
  private val cameraProvider = ProcessCameraProvider.getInstance(context)
  private var camera: Camera? = null

  // Camera State
  private var photoOutput: PhotoOutput? = null
  private var videoOutput: VideoPipelineOutput? = null
  private var codeScannerOutput: BarcodeScannerOutput? = null
  private val mutex = Mutex()
  private var isDestroyed = false
  private val lifecycleRegistry = LifecycleRegistry(this)

  // Video Outputs
  private var recording: RecordingSession? = null
    set(value) {
      field = value
      updateVideoOutputs()
    }

  val orientation: Orientation
    get() {
      val cameraId = configuration?.cameraId ?: return Orientation.PORTRAIT
      val characteristics = cameraManager.getCameraCharacteristics(cameraId)
      val sensorRotation = characteristics.get(CameraCharacteristics.SENSOR_ORIENTATION) ?: 0
      return Orientation.fromRotationDegrees(sensorRotation)
    }

  init {
    lifecycleRegistry.currentState = Lifecycle.State.CREATED
  }

  override fun close() {
    Log.i(TAG, "Closing CameraSession...")
    isDestroyed = true
    lifecycleRegistry.currentState = Lifecycle.State.DESTROYED

    photoOutput?.close()
    photoOutput = null
    videoOutput?.close()
    videoOutput = null
    codeScannerOutput?.close()
    codeScannerOutput = null
    Log.i(TAG, "CameraSession closed!")
  }

  override fun getLifecycle(): Lifecycle {
    return lifecycleRegistry
  }

  suspend fun configure(lambda: (configuration: CameraConfiguration) -> Unit) {
    Log.i(TAG, "configure { ... }: Waiting for lock...")

    mutex.withLock {
      // Let caller configure a new configuration for the Camera.
      val config = CameraConfiguration.copyOf(this.configuration)
      lambda(config)
      val diff = CameraConfiguration.difference(this.configuration, config)
      this.configuration = config

      if (!diff.hasChanges) {
        Log.i(TAG, "Nothing changed, aborting configure { ... }")
        return@withLock
      }

      if (isDestroyed) {
        Log.i(TAG, "CameraSession is already destroyed. Skipping configure { ... }")
        return@withLock
      }

      Log.i(TAG, "configure { ... }: Updating CameraSession Configuration... $diff")

      try {
        // Build up session or update any props
        if (diff.deviceChanged || diff.outputsChanged) {
          // 1. cameraId changed, open device
          configureCamera(config)
        }
        if (diff.isActiveChanged) {
          // 4. Either start or stop the session
          configureIsActive(config)
        }

        Log.i(
          TAG,
          "configure { ... }: Completed CameraSession Configuration! (State: ${lifecycle.currentState})"
        )

        // Notify about Camera initialization
        if (diff.deviceChanged) {
          callback.onInitialized()
        }
      } catch (error: Throwable) {
        Log.e(TAG, "Failed to configure CameraSession! Error: ${error.message}, Config-Diff: $diff", error)
        callback.onError(error)
      }
    }
  }

  private fun checkPermission() {
    val status = ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA)
    if (status != PackageManager.PERMISSION_GRANTED) throw CameraPermissionError()
  }

  private suspend fun configureCamera(configuration: CameraConfiguration) {
    Log.i(TAG, "Configuring Camera...")
    checkPermission()

    // Get the ProcessCameraProvider (should only await on the first call, then be an instant return)
    val provider = cameraProvider.await()

    // Input
    val cameraId = configuration.cameraId ?: throw NoCameraDeviceError()
    val cameraSelector = CameraSelector.Builder().byId(cameraId).build()

    // Outputs
    val preview = Preview.Builder()
    configuration.fps?.let { fps ->
      preview.setTargetFrameRate(Range(fps, fps))
    }

    // Bind it all together
    camera = provider.bindToLifecycle(this, cameraSelector, preview.build())
  }

  private fun configureIsActive(config: CameraConfiguration) {
    if (config.isActive) {
      lifecycleRegistry.currentState = Lifecycle.State.RESUMED
    } else {
      // TODO: STARTED or CREATED? Which one keeps the camera warm?
      lifecycleRegistry.currentState = Lifecycle.State.STARTED
    }
  }

  suspend fun takePhoto(
    qualityPrioritization: QualityPrioritization,
    flash: Flash,
    enableShutterSound: Boolean,
    enableAutoStabilization: Boolean,
    outputOrientation: Orientation
  ): CapturedPhoto {
    throw NotImplementedError()
  }

  private fun updateVideoOutputs() {
    val videoOutput = videoOutput ?: return
    Log.i(TAG, "Updating Video Outputs...")
    videoOutput.videoPipeline.setRecordingSessionOutput(recording)
  }

  suspend fun startRecording(
    enableAudio: Boolean,
    options: RecordVideoOptions,
    callback: (video: RecordingSession.Video) -> Unit,
    onError: (error: CameraError) -> Unit
  ) {
    throw NotImplementedError()
  }

  suspend fun stopRecording() {
    mutex.withLock {
      val recording = recording ?: throw NoRecordingInProgressError()

      recording.stop()
      this.recording = null
    }
  }

  suspend fun pauseRecording() {
    mutex.withLock {
      val recording = recording ?: throw NoRecordingInProgressError()
      recording.pause()
    }
  }

  suspend fun resumeRecording() {
    mutex.withLock {
      val recording = recording ?: throw NoRecordingInProgressError()
      recording.resume()
    }
  }

  suspend fun focus(x: Int, y: Int) {
    throw NotImplementedError()
  }

  data class CapturedPhoto(
    val image: Image,
    val metadata: TotalCaptureResult,
    val orientation: Orientation,
    val isMirrored: Boolean,
    val format: Int
  ) : Closeable {
    override fun close() {
      image.close()
    }
  }

  interface Callback {
    fun onError(error: Throwable)
    fun onFrame(frame: Frame)
    fun onInitialized()
    fun onStarted()
    fun onStopped()
    fun onCodeScanned(codes: List<Barcode>, scannerFrame: CodeScannerFrame)
  }
}

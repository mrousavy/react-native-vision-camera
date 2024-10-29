package com.mrousavy.camera.core

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioManager
import android.util.Log
import androidx.annotation.MainThread
import androidx.camera.core.Camera
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageCapture
import androidx.camera.core.Preview
import androidx.camera.core.UseCase
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.video.Recorder
import androidx.camera.video.Recording
import androidx.camera.video.VideoCapture
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LifecycleRegistry
import com.facebook.react.bridge.UiThreadUtil
import com.google.mlkit.vision.barcode.common.Barcode
import com.mrousavy.camera.core.extensions.await
import com.mrousavy.camera.core.types.Orientation
import com.mrousavy.camera.core.types.ShutterType
import com.mrousavy.camera.core.utils.runOnUiThread
import com.mrousavy.camera.frameprocessors.Frame
import java.io.Closeable
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

class CameraSession(internal val context: Context, internal val callback: Callback) :
  Closeable,
  LifecycleOwner,
  OrientationManager.Callback {
  companion object {
    internal const val TAG = "CameraSession"
  }

  // Camera Configuration
  internal var configuration: CameraConfiguration? = null
  internal val cameraProvider = ProcessCameraProvider.getInstance(context)
  internal var camera: Camera? = null

  // Camera Outputs
  internal var previewOutput: Preview? = null
  internal var photoOutput: ImageCapture? = null
  internal var videoOutput: VideoCapture<Recorder>? = null
  internal var frameProcessorOutput: ImageAnalysis? = null
  internal var codeScannerOutput: ImageAnalysis? = null
  internal var currentUseCases: List<UseCase> = emptyList()

  // Camera Outputs State
  internal val metadataProvider = MetadataProvider(context)
  internal val orientationManager = OrientationManager(context, this)
  internal var recorderOutput: Recorder? = null

  // Camera State
  internal val mutex = Mutex()
  internal var isDestroyed = false
  internal val lifecycleRegistry = LifecycleRegistry(this)
  internal var recording: Recording? = null
  internal var isRecordingCanceled = false
  internal val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager

  // Threading
  internal val mainExecutor = ContextCompat.getMainExecutor(context)

  // Orientation
  val outputOrientation: Orientation
    get() = orientationManager.outputOrientation

  init {
    lifecycleRegistry.currentState = Lifecycle.State.CREATED
    lifecycle.addObserver(object : LifecycleEventObserver {
      override fun onStateChanged(source: LifecycleOwner, event: Lifecycle.Event) {
        Log.i(TAG, "Camera Lifecycle changed to ${event.targetState}!")
      }
    })
  }

  override fun close() {
    Log.i(TAG, "Closing CameraSession...")
    isDestroyed = true
    orientationManager.stopOrientationUpdates()
    runOnUiThread {
      lifecycleRegistry.currentState = Lifecycle.State.DESTROYED
    }
  }

  override fun getLifecycle(): Lifecycle = lifecycleRegistry

  /**
   * Configures the [CameraSession] with new values in one batch.
   * This must be called from the Main UI Thread.
   */
  @MainThread
  suspend fun configure(lambda: (configuration: CameraConfiguration) -> Unit) {
    if (!UiThreadUtil.isOnUiThread()) {
      throw Error("configure { ... } must be called from the Main UI Thread!")
    }
    Log.i(TAG, "configure { ... }: Waiting for lock...")

    val provider = cameraProvider.await(mainExecutor)

    mutex.withLock {
      // Let caller configure a new configuration for the Camera.
      val config = CameraConfiguration.copyOf(this.configuration)
      try {
        lambda(config)
      } catch (e: CameraConfiguration.AbortThrow) {
        // config changes have been aborted.
        return
      }
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
        if (diff.outputsChanged) {
          // 1. outputs changed, re-create them
          configureOutputs(config)
          // 1.1. whenever the outputs changed, we need to update their orientation as well
          configureOrientation()
        }
        if (diff.deviceChanged) {
          // 2. input or outputs changed, or the session was destroyed from outside, rebind the session
          configureCamera(provider, config)
        }
        if (diff.sidePropsChanged) {
          // 3. side props such as zoom, exposure or torch changed.
          configureSideProps(config)
        }
        if (diff.isActiveChanged) {
          // 4. start or stop the session
          configureIsActive(config)
        }
        if (diff.orientationChanged) {
          // 5. update the target orientation mode
          orientationManager.setTargetOutputOrientation(config.outputOrientation)
        }
        if (diff.locationChanged) {
          // 6. start or stop location update streaming
          metadataProvider.enableLocationUpdates(config.enableLocation)
        }

        Log.i(
          TAG,
          "configure { ... }: Completed CameraSession Configuration! (State: ${lifecycle.currentState})"
        )
      } catch (error: Throwable) {
        Log.e(TAG, "Failed to configure CameraSession! Error: ${error.message}, Config-Diff: $diff", error)
        callback.onError(error)
      }
    }
  }

  internal fun checkCameraPermission() {
    val status = ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA)
    if (status != PackageManager.PERMISSION_GRANTED) throw CameraPermissionError()
  }
  internal fun checkMicrophonePermission() {
    val status = ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO)
    if (status != PackageManager.PERMISSION_GRANTED) throw MicrophonePermissionError()
  }

  override fun onOutputOrientationChanged(outputOrientation: Orientation) {
    Log.i(TAG, "Output orientation changed! $outputOrientation")
    configureOrientation()
    callback.onOutputOrientationChanged(outputOrientation)
  }

  override fun onPreviewOrientationChanged(previewOrientation: Orientation) {
    Log.i(TAG, "Preview orientation changed! $previewOrientation")
    configureOrientation()
    callback.onPreviewOrientationChanged(previewOrientation)
  }

  private fun configureOrientation() {
    // Preview Orientation
    orientationManager.previewOrientation.toSurfaceRotation().let { previewRotation ->
      previewOutput?.targetRotation = previewRotation
      codeScannerOutput?.targetRotation = previewRotation
    }
    // Outputs Orientation
    orientationManager.outputOrientation.toSurfaceRotation().let { outputRotation ->
      photoOutput?.targetRotation = outputRotation
      videoOutput?.targetRotation = outputRotation
    }
    // Frame Processor output will not receive a target rotation, user is responsible for rotating himself
  }

  interface Callback {
    fun onError(error: Throwable)
    fun onFrame(frame: Frame)
    fun onInitialized()
    fun onStarted()
    fun onStopped()
    fun onShutter(type: ShutterType)
    fun onOutputOrientationChanged(outputOrientation: Orientation)
    fun onPreviewOrientationChanged(previewOrientation: Orientation)
    fun onCodeScanned(codes: List<Barcode>, scannerFrame: CodeScannerFrame)
  }
}

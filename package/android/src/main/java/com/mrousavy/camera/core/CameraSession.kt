package com.mrousavy.camera.core

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.provider.MediaStore
import android.util.Log
import android.util.Range
import androidx.annotation.OptIn
import androidx.camera.core.Camera
import androidx.camera.core.CameraInfo
import androidx.camera.core.CameraSelector
import androidx.camera.core.CameraState
import androidx.camera.core.DynamicRange
import androidx.camera.core.ImageCapture
import androidx.camera.core.MirrorMode
import androidx.camera.core.Preview
import androidx.camera.core.UseCase
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.video.ExperimentalPersistentRecording
import androidx.camera.video.FileOutputOptions
import androidx.camera.video.MediaStoreOutputOptions
import androidx.camera.video.Quality
import androidx.camera.video.QualitySelector
import androidx.camera.video.Recorder
import androidx.camera.video.Recording
import androidx.camera.video.VideoCapture
import androidx.camera.video.VideoOutput
import androidx.camera.video.VideoRecordEvent
import androidx.core.content.ContextCompat
import androidx.core.util.Consumer
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LifecycleRegistry
import com.google.mlkit.vision.barcode.common.Barcode
import com.mrousavy.camera.core.outputs.BarcodeScannerOutput
import com.mrousavy.camera.core.outputs.VideoPipelineOutput
import com.mrousavy.camera.extensions.await
import com.mrousavy.camera.extensions.byId
import com.mrousavy.camera.extensions.takePicture
import com.mrousavy.camera.extensions.toCameraError
import com.mrousavy.camera.frameprocessor.Frame
import com.mrousavy.camera.types.Flash
import com.mrousavy.camera.types.Orientation
import com.mrousavy.camera.types.QualityPrioritization
import com.mrousavy.camera.types.RecordVideoOptions
import com.mrousavy.camera.utils.FileUtils
import com.mrousavy.camera.utils.runOnUiThread
import com.mrousavy.camera.utils.runOnUiThreadAndWait
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.io.Closeable
import java.io.File

class CameraSession(private val context: Context, private val cameraManager: CameraManager, private val callback: Callback) :
  Closeable, LifecycleOwner {
  companion object {
    private const val TAG = "CameraSession"
  }

  // Camera Configuration
  private var configuration: CameraConfiguration? = null
  private val cameraProvider = ProcessCameraProvider.getInstance(context)
  private var camera: Camera? = null

  // Camera Outputs
  private var previewOutput: Preview? = null
  private var photoOutput: ImageCapture? = null
  private var videoOutput: VideoCapture<Recorder>? = null
  private var codeScannerOutput: BarcodeScannerOutput? = null

  // Camera State
  private val mutex = Mutex()
  private var isDestroyed = false
  private val lifecycleRegistry = LifecycleRegistry(this)
  private var recording: Recording? = null

  val orientation: Orientation
    get() {
      val cameraId = configuration?.cameraId ?: return Orientation.PORTRAIT
      val characteristics = cameraManager.getCameraCharacteristics(cameraId)
      val sensorRotation = characteristics.get(CameraCharacteristics.SENSOR_ORIENTATION) ?: 0
      return Orientation.fromRotationDegrees(sensorRotation)
    }

  init {
    lifecycleRegistry.currentState = Lifecycle.State.CREATED
    lifecycle.addObserver(object: LifecycleEventObserver {
      override fun onStateChanged(source: LifecycleOwner, event: Lifecycle.Event) {
        Log.i(TAG, "Camera Lifecycle changed to ${event.targetState}!")
      }
    })
  }

  override fun close() {
    Log.i(TAG, "Closing CameraSession...")
    isDestroyed = true
    runOnUiThread {
      lifecycleRegistry.currentState = Lifecycle.State.DESTROYED
    }

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
        val provider = cameraProvider.await()
        runOnUiThreadAndWait {
          if (diff.deviceChanged || diff.outputsChanged) {
            // 1. cameraId changed, open device
            configureCamera(provider, config)
          }
          if (diff.isActiveChanged) {
            // 4. Either start or stop the session
            configureIsActive(config)
          }
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

  private fun checkCameraPermission() {
    val status = ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA)
    if (status != PackageManager.PERMISSION_GRANTED) throw CameraPermissionError()
  }
  private fun checkMicrophonePermission() {
    val status = ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO)
    if (status != PackageManager.PERMISSION_GRANTED) throw MicrophonePermissionError()
  }

  @SuppressLint("RestrictedApi")
  private fun configureCamera(provider: ProcessCameraProvider, configuration: CameraConfiguration) {
    Log.i(TAG, "Initializing Camera...")
    checkCameraPermission()

    // Unbind previous Camera
    provider.unbindAll()

    // Input
    val cameraId = configuration.cameraId ?: throw NoCameraDeviceError()
    val cameraSelector = CameraSelector.Builder().byId(cameraId).build()

    // Outputs
    val useCases = mutableListOf<UseCase>()

    // 1. Preview
    val previewConfig = configuration.preview as? CameraConfiguration.Output.Enabled<CameraConfiguration.Preview>
    if (previewConfig != null) {
      val preview = Preview.Builder().also { preview ->
        preview.setMirrorMode(MirrorMode.MIRROR_MODE_ON_FRONT_ONLY)
        configuration.fps?.let { fps ->
          preview.setTargetFrameRate(Range(fps, fps))
        }
      }.build()
      preview.setSurfaceProvider(previewConfig.config.surfaceProvider)
      useCases.add(preview)
      previewOutput = preview
    } else {
      previewOutput = null
    }

    // 2. Image Capture
    val photoConfig = configuration.photo as? CameraConfiguration.Output.Enabled<CameraConfiguration.Photo>
    if (photoConfig != null) {
      val photo = ImageCapture.Builder().also { photo ->
        // TODO: Configure qualityPrioritization here
        photo.setMirrorMode(MirrorMode.MIRROR_MODE_ON_FRONT_ONLY)
      }.build()
      useCases.add(photo)
      photoOutput = photo
    } else {
      photoOutput = null
    }

    // 3. Video Capture
    val videoConfig = configuration.video as? CameraConfiguration.Output.Enabled<CameraConfiguration.Video>
    if (videoConfig != null) {
      val recorder = Recorder.Builder().also { recorder ->
        configuration.format?.let { format ->
          recorder.setQualitySelector(format.videoQualitySelector)
        }
        // TODO: Make videoBitRate a Camera Prop
        // video.setTargetVideoEncodingBitRate()
      }.build()

      val video = VideoCapture.Builder(recorder).also { video ->
        video.setMirrorMode(MirrorMode.MIRROR_MODE_ON_FRONT_ONLY)
        configuration.fps?.let { fps ->
          video.setTargetFrameRate(Range(fps, fps))
        }
        if (videoConfig.config.enableHdr) {
          video.setDynamicRange(DynamicRange.HDR_UNSPECIFIED_10_BIT)
        }
      }.build()
      useCases.add(video)
      videoOutput = video
    } else {
      videoOutput = null
    }

    // Bind it all together
    camera = provider.bindToLifecycle(this, cameraSelector, *useCases.toTypedArray())
    var lastState = CameraState.Type.OPENING
    camera!!.cameraInfo.cameraState.observeForever { state ->
      Log.i(TAG, "Camera State: ${state.type} (has error: ${state.error != null}")

      if (state.type == CameraState.Type.OPEN && state.type != lastState) {
        // Camera has now been initialized!
        callback.onInitialized()
        lastState = state.type
      }

      val error = state.error
      if (error != null) {
        // A Camera error occurred!
        callback.onError(error.toCameraError())
      }
    }
    Log.i(TAG, "Successfully initialized Camera!")
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
  ): Photo {
    mutex.withLock {
      val camera = camera ?: throw CameraNotReadyError()
      val photoOutput = photoOutput ?: throw PhotoNotEnabledError()

      // TODO: Add shutter sound, stabilization and quality prioritization support here?

      photoOutput.flashMode = flash.toFlashMode()
      photoOutput.targetRotation = outputOrientation.toDegrees()

      val image = photoOutput.takePicture(CameraQueues.cameraQueue.executor)
      val isMirrored = camera.cameraInfo.lensFacing == CameraSelector.LENS_FACING_FRONT
      return Photo(image, isMirrored)
    }
  }

  private fun updateVideoOutputs() {
    val videoOutput = videoOutput ?: return
    Log.i(TAG, "Updating Video Outputs...")
    // TODO: Add Frame Processor here somehow?
    // videoOutput.videoPipeline.setRecordingSessionOutput(recording)
  }

  @OptIn(ExperimentalPersistentRecording::class) @SuppressLint("MissingPermission")
  suspend fun startRecording(
    enableAudio: Boolean,
    options: RecordVideoOptions,
    callback: (video: RecordingSession.Video) -> Unit,
    onError: (error: CameraError) -> Unit
  ) {
    val camera = camera ?: throw CameraNotReadyError()
    val videoOutput = videoOutput ?: throw VideoNotEnabledError()

    val file = FileUtils.createTempFile(context, "mp4")
    val outputOptions = FileOutputOptions.Builder(file).build()
    var pendingRecording = videoOutput.output.prepareRecording(context, outputOptions)
    if (enableAudio) {
      checkMicrophonePermission()
      pendingRecording = pendingRecording.withAudioEnabled()
    }
    pendingRecording = pendingRecording.asPersistentRecording()
    recording = pendingRecording.start(CameraQueues.cameraQueue.executor) { event ->
      when (event) {
        is VideoRecordEvent.Start -> Log.i(TAG, "Recording started!")
        is VideoRecordEvent.Resume -> Log.i(TAG, "Recording resumed!")
        is VideoRecordEvent.Pause -> Log.i(TAG, "Recording paused!")
        is VideoRecordEvent.Status -> Log.i(TAG, "Status update! Recorded ${event.recordingStats.numBytesRecorded} bytes.")
        is VideoRecordEvent.Finalize -> {
          Log.i(TAG, "Recording stopped!")
          // TODO: Check for errors.
          // TODO: Callback with resulting video now.
        }
      }
    }
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

  interface Callback {
    fun onError(error: Throwable)
    fun onFrame(frame: Frame)
    fun onInitialized()
    fun onStarted()
    fun onStopped()
    fun onCodeScanned(codes: List<Barcode>, scannerFrame: CodeScannerFrame)
  }
}

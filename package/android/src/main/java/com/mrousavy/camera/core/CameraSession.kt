package com.mrousavy.camera.core

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.util.Log
import android.util.Range
import android.util.Size
import androidx.annotation.MainThread
import androidx.annotation.OptIn
import androidx.camera.core.Camera
import androidx.camera.core.CameraControl
import androidx.camera.core.CameraSelector
import androidx.camera.core.CameraState
import androidx.camera.core.DynamicRange
import androidx.camera.core.FocusMeteringAction
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageCapture
import androidx.camera.core.MeteringPoint
import androidx.camera.core.MirrorMode
import androidx.camera.core.Preview
import androidx.camera.core.TorchState
import androidx.camera.core.UseCaseGroup
import androidx.camera.core.resolutionselector.ResolutionSelector
import androidx.camera.extensions.ExtensionMode
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.video.ExperimentalPersistentRecording
import androidx.camera.video.FileOutputOptions
import androidx.camera.video.Recorder
import androidx.camera.video.Recording
import androidx.camera.video.VideoCapture
import androidx.camera.video.VideoRecordEvent
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LifecycleRegistry
import com.facebook.react.bridge.UiThreadUtil
import com.google.mlkit.vision.barcode.common.Barcode
import com.mrousavy.camera.extensions.await
import com.mrousavy.camera.extensions.byId
import com.mrousavy.camera.extensions.forSize
import com.mrousavy.camera.extensions.getCameraError
import com.mrousavy.camera.extensions.takePicture
import com.mrousavy.camera.extensions.toCameraError
import com.mrousavy.camera.extensions.withExtension
import com.mrousavy.camera.frameprocessor.Frame
import com.mrousavy.camera.types.Flash
import com.mrousavy.camera.types.Orientation
import com.mrousavy.camera.types.RecordVideoOptions
import com.mrousavy.camera.types.Torch
import com.mrousavy.camera.types.Video
import com.mrousavy.camera.types.VideoStabilizationMode
import com.mrousavy.camera.utils.FileUtils
import com.mrousavy.camera.utils.runOnUiThread
import java.io.Closeable
import kotlin.math.roundToInt
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

class CameraSession(private val context: Context, private val callback: Callback) :
  Closeable,
  LifecycleOwner {
  companion object {
    private var instancesCounter = 1
    private var latestOpenerTag = instancesCounter
  }

  // Reference
  private val instanceId = instancesCounter++
  @Suppress("PrivatePropertyName")
  private val TAG = "CameraSession${instanceId}"

  // Camera Configuration
  private var configuration: CameraConfiguration? = null
  private val cameraProvider = ProcessCameraProvider.getInstance(context)
  private var camera: Camera? = null

  // Camera Outputs
  private var previewOutput: Preview? = null
  private var photoOutput: ImageCapture? = null
  private var videoOutput: VideoCapture<Recorder>? = null
  private var codeScannerOutput: ImageAnalysis? = null

  // Camera Outputs State
  private var recorderOutput: Recorder? = null
  private var frameProcessorEffect: FrameProcessorEffect? = null

  // Camera State
  private val mutex = Mutex()
  private var isDestroyed = false
  private val lifecycleRegistry = LifecycleRegistry(this)
  private var recording: Recording? = null
  private var isRecordingCanceled = false
  private val didSessionChangeFromOutside: Boolean
    get() = instanceId != latestOpenerTag

  // Threading
  private val mainExecutor = ContextCompat.getMainExecutor(context)

  init {
    lifecycleRegistry.currentState = Lifecycle.State.STARTED
    lifecycle.addObserver(object : LifecycleEventObserver {
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
        if (diff.outputsChanged) {
          // 1. outputs changed, re-create them
          configureOutputs(config)
        }
        if (diff.deviceChanged || diff.outputsChanged || didSessionChangeFromOutside) {
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

  private fun getTargetFpsRange(configuration: CameraConfiguration): Range<Int>? {
    val fps = configuration.fps ?: return null
    return if (configuration.enableLowLightBoost) {
      Range(fps / 2, fps)
    } else {
      Range(fps, fps)
    }
  }

  @SuppressLint("RestrictedApi")
  @Suppress("LiftReturnOrAssignment")
  private fun configureOutputs(configuration: CameraConfiguration) {
    Log.i(TAG, "Creating new Outputs for Camera #${configuration.cameraId}...")
    val fpsRange = getTargetFpsRange(configuration)
    val format = configuration.format

    Log.i(TAG, "Using FPS Range: $fpsRange")

    // TODO: Check if all of the values we set are supported with Video/Photo/Preview Capabilities from CameraInfo.

    // 1. Preview
    val previewConfig = configuration.preview as? CameraConfiguration.Output.Enabled<CameraConfiguration.Preview>
    if (previewConfig != null) {
      Log.i(TAG, "Creating Preview output...")
      val preview = Preview.Builder().also { preview ->
        // Configure Preview Output
        if (configuration.videoStabilizationMode.isAtLeast(VideoStabilizationMode.CINEMATIC)) {
          preview.setPreviewStabilizationEnabled(true)
        }
        if (fpsRange != null) {
          preview.setTargetFrameRate(fpsRange)
        }
      }.build()
      preview.setSurfaceProvider(previewConfig.config.surfaceProvider)
      previewOutput = preview
    } else {
      previewOutput = null
    }

    // 2. Image Capture
    val photoConfig = configuration.photo as? CameraConfiguration.Output.Enabled<CameraConfiguration.Photo>
    if (photoConfig != null) {
      Log.i(TAG, "Creating Photo output...")
      val photo = ImageCapture.Builder().also { photo ->
        // Configure Photo Output
        photo.setCaptureMode(photoConfig.config.photoQualityBalance.toCaptureMode())
        if (format != null) {
          Log.i(TAG, "Photo size: ${format.photoSize}")
          val resolutionSelector = ResolutionSelector.Builder().forSize(format.photoSize)
          photo.setResolutionSelector(resolutionSelector.build())
        }
      }.build()
      photoOutput = photo
    } else {
      photoOutput = null
    }

    // 3. Video Capture
    val videoConfig = configuration.video as? CameraConfiguration.Output.Enabled<CameraConfiguration.Video>
    if (videoConfig != null) {
      Log.i(TAG, "Creating Video output...")
      val currentRecorder = recorderOutput
      val recorder = if (recording != null && currentRecorder != null) {
        // If we are currently recording, then don't re-create the recorder instance.
        // Instead, re-use it so we don't cancel the active recording.
        Log.i(TAG, "Re-using active Recorder because we are currently recording...")
        currentRecorder
      } else {
        // We are currently not recording, so we can re-create a recorder instance if needed.
        Log.i(TAG, "Creating new Recorder...")
        Recorder.Builder().also { recorder ->
          configuration.format?.let { format ->
            recorder.setQualitySelector(format.videoQualitySelector)
          }
          // TODO: Make videoBitRate a Camera Prop
          // video.setTargetVideoEncodingBitRate()
        }.build()
      }

      val video = VideoCapture.Builder(recorder).also { video ->
        // Configure Video Output
        video.setMirrorMode(MirrorMode.MIRROR_MODE_ON_FRONT_ONLY)
        if (configuration.videoStabilizationMode.isAtLeast(VideoStabilizationMode.STANDARD)) {
          video.setVideoStabilizationEnabled(true)
        }
        if (fpsRange != null) {
          video.setTargetFrameRate(fpsRange)
        }
        if (videoConfig.config.enableHdr) {
          video.setDynamicRange(DynamicRange.HDR_UNSPECIFIED_10_BIT)
        }
        if (format != null) {
          Log.i(TAG, "Video size: ${format.videoSize}")
          val resolutionSelector = ResolutionSelector.Builder().forSize(format.videoSize)
          video.setResolutionSelector(resolutionSelector.build())
        }
      }.build()
      videoOutput = video
      recorderOutput = recorder
    } else {
      videoOutput = null
      recorderOutput = null
    }

    // 3.5 Frame Processor (middleman)
    if (videoConfig != null && videoConfig.config.enableFrameProcessor) {
      // The FrameProcessorEffect is a middle-man between the Camera stream and the output surfaces.
      frameProcessorEffect = FrameProcessorEffect(videoConfig.config.pixelFormat, videoConfig.config.enableGpuBuffers, callback)
    } else {
      frameProcessorEffect = null
    }

    // 4. Code Scanner
    val codeScannerConfig = configuration.codeScanner as? CameraConfiguration.Output.Enabled<CameraConfiguration.CodeScanner>
    if (codeScannerConfig != null) {
      if (previewOutput != null && photoOutput != null && videoOutput != null) {
        throw CodeScannerTooManyOutputsError()
      }

      Log.i(TAG, "Creating CodeScanner output...")
      val analyzer = ImageAnalysis.Builder().build()
      val pipeline = CodeScannerPipeline(codeScannerConfig.config, callback)
      analyzer.setAnalyzer(CameraQueues.analyzerExecutor, pipeline)
      codeScannerOutput = analyzer
    } else {
      codeScannerOutput = null
    }
    Log.i(TAG, "Successfully created new Outputs for Camera #${configuration.cameraId}!")
  }

  @Suppress("LiftReturnOrAssignment")
  private suspend fun configureCamera(provider: ProcessCameraProvider, configuration: CameraConfiguration) {
    Log.i(TAG, "Binding Camera #${configuration.cameraId}...")
    checkCameraPermission()

    // Input
    val cameraId = configuration.cameraId ?: throw NoCameraDeviceError()
    var cameraSelector = CameraSelector.Builder().byId(cameraId).build()

    val needsImageAnalysis = codeScannerOutput != null
    if (configuration.enableHdr) {
      cameraSelector = cameraSelector.withExtension(context, provider, needsImageAnalysis, ExtensionMode.HDR, "HDR")
    }
    if (configuration.enableLowLightBoost) {
      cameraSelector = cameraSelector.withExtension(context, provider, needsImageAnalysis, ExtensionMode.NIGHT, "NIGHT")
    }

    // Outputs
    val useCases = listOfNotNull(previewOutput, photoOutput, videoOutput, codeScannerOutput)
    if (useCases.isEmpty()) {
      throw NoOutputsError()
    }

    // Unbind previous Camera
    provider.unbindAll()

    // Frame Processor is a CameraEffect (Surface middleman)
    val frameProcessorEffect = frameProcessorEffect
    if (frameProcessorEffect != null) {
      val useCaseGroup = UseCaseGroup.Builder()
      useCases.forEach { useCase -> useCaseGroup.addUseCase(useCase) }
      useCaseGroup.addEffect(frameProcessorEffect)

      // Bind it all together (must be on UI Thread)
      camera = provider.bindToLifecycle(this, cameraSelector, useCaseGroup.build())
    } else {
      // Bind it all together (must be on UI Thread)
      camera = provider.bindToLifecycle(this, cameraSelector, *useCases.toTypedArray())
    }
    latestOpenerTag = instanceId

    // Listen to Camera events
    var lastState = CameraState.Type.OPENING
    camera!!.cameraInfo.cameraState.observe(this) { state ->
      Log.i(TAG, "Camera State: ${state.type} (has error: ${state.error != null})")

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
    Log.i(TAG, "Successfully bound Camera #${configuration.cameraId}!")
  }

  private fun configureSideProps(config: CameraConfiguration) {
    val camera = camera ?: throw CameraNotReadyError()

    // Zoom
    val currentZoom = camera.cameraInfo.zoomState.value?.zoomRatio
    if (currentZoom != config.zoom) {
      camera.cameraControl.setZoomRatio(config.zoom)
    }

    // Torch
    val currentTorch = camera.cameraInfo.torchState.value == TorchState.ON
    val newTorch = config.torch == Torch.ON
    if (currentTorch != newTorch) {
      if (newTorch && !camera.cameraInfo.hasFlashUnit()) {
        throw FlashUnavailableError()
      }
      camera.cameraControl.enableTorch(newTorch)
    }

    // Exposure
    val currentExposureCompensation = camera.cameraInfo.exposureState.exposureCompensationIndex
    val exposureCompensation = config.exposure?.roundToInt() ?: 0
    if (currentExposureCompensation != exposureCompensation) {
      camera.cameraControl.setExposureCompensationIndex(exposureCompensation)
    }
  }

  private fun configureIsActive(config: CameraConfiguration) {
    if (config.isActive) {
      lifecycleRegistry.currentState = Lifecycle.State.RESUMED
    } else {
      lifecycleRegistry.currentState = Lifecycle.State.CREATED
    }
  }

  suspend fun takePhoto(flash: Flash, enableShutterSound: Boolean, outputOrientation: Orientation): Photo {
    val camera = camera ?: throw CameraNotReadyError()
    val photoOutput = photoOutput ?: throw PhotoNotEnabledError()

    if (flash != Flash.OFF && !camera.cameraInfo.hasFlashUnit()) {
      throw FlashUnavailableError()
    }

    photoOutput.flashMode = flash.toFlashMode()
    photoOutput.targetRotation = outputOrientation.toDegrees()

    val image = photoOutput.takePicture(enableShutterSound, callback, CameraQueues.cameraExecutor)
    val isMirrored = camera.cameraInfo.lensFacing == CameraSelector.LENS_FACING_FRONT
    return Photo(image, isMirrored)
  }

  @OptIn(ExperimentalPersistentRecording::class)
  @SuppressLint("MissingPermission", "RestrictedApi")
  fun startRecording(
    enableAudio: Boolean,
    options: RecordVideoOptions,
    callback: (video: Video) -> Unit,
    onError: (error: CameraError) -> Unit
  ) {
    if (camera == null) throw CameraNotReadyError()
    if (recording != null) throw RecordingInProgressError()
    val videoOutput = videoOutput ?: throw VideoNotEnabledError()

    val file = FileUtils.createTempFile(context, options.fileType.toExtension())
    val outputOptions = FileOutputOptions.Builder(file).build()
    var pendingRecording = videoOutput.output.prepareRecording(context, outputOptions)
    if (enableAudio) {
      checkMicrophonePermission()
      pendingRecording = pendingRecording.withAudioEnabled()
    }
    pendingRecording = pendingRecording.asPersistentRecording()

    val size = videoOutput.attachedSurfaceResolution ?: Size(0, 0)
    isRecordingCanceled = false
    recording = pendingRecording.start(CameraQueues.cameraExecutor) { event ->
      when (event) {
        is VideoRecordEvent.Start -> Log.i(TAG, "Recording started!")
        is VideoRecordEvent.Resume -> Log.i(TAG, "Recording resumed!")
        is VideoRecordEvent.Pause -> Log.i(TAG, "Recording paused!")
        is VideoRecordEvent.Status -> Log.i(TAG, "Status update! Recorded ${event.recordingStats.numBytesRecorded} bytes.")
        is VideoRecordEvent.Finalize -> {
          if (isRecordingCanceled) {
            Log.i(TAG, "Recording was canceled, deleting file..")
            onError(RecordingCanceledError())
            try {
              file.delete()
            } catch (e: Throwable) {
              this.callback.onError(FileIOError(e))
            }
            return@start
          }

          Log.i(TAG, "Recording stopped!")
          val error = event.getCameraError()
          if (error != null) {
            if (error.wasVideoRecorded) {
              Log.e(TAG, "Video Recorder encountered an error, but the video was recorded anyways.", error)
            } else {
              Log.e(TAG, "Video Recorder encountered a fatal error!", error)
              onError(error)
              return@start
            }
          }
          val durationMs = event.recordingStats.recordedDurationNanos / 1_000_000
          Log.i(TAG, "Successfully completed video recording! Captured ${durationMs.toDouble() / 1_000.0} seconds.")
          val path = event.outputResults.outputUri.path ?: throw UnknownRecorderError(false, null)
          val video = Video(path, durationMs, size)
          callback(video)
        }
      }
    }
  }

  fun stopRecording() {
    val recording = recording ?: throw NoRecordingInProgressError()

    recording.stop()
    this.recording = null
  }

  fun cancelRecording() {
    isRecordingCanceled = true
    stopRecording()
  }

  fun pauseRecording() {
    val recording = recording ?: throw NoRecordingInProgressError()
    recording.pause()
  }

  fun resumeRecording() {
    val recording = recording ?: throw NoRecordingInProgressError()
    recording.resume()
  }

  @SuppressLint("RestrictedApi")
  suspend fun focus(meteringPoint: MeteringPoint) {
    val camera = camera ?: throw CameraNotReadyError()

    val action = FocusMeteringAction.Builder(meteringPoint).build()
    if (!camera.cameraInfo.isFocusMeteringSupported(action)) {
      throw FocusNotSupportedError()
    }

    try {
      Log.i(TAG, "Focusing to ${action.meteringPointsAf.joinToString { "(${it.x}, ${it.y})" }}...")
      val future = camera.cameraControl.startFocusAndMetering(action)
      val result = future.await(CameraQueues.cameraExecutor)
      if (result.isFocusSuccessful) {
        Log.i(TAG, "Focused successfully!")
      } else {
        Log.i(TAG, "Focus failed.")
      }
    } catch (e: CameraControl.OperationCanceledException) {
      throw FocusCanceledError()
    }
  }

  interface Callback {
    fun onError(error: Throwable)
    fun onFrame(frame: Frame)
    fun onInitialized()
    fun onStarted()
    fun onStopped()
    fun onShutter()
    fun onCodeScanned(codes: List<Barcode>, scannerFrame: CodeScannerFrame)
  }
}

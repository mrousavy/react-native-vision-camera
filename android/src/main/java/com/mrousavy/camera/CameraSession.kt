package com.mrousavy.camera

import android.graphics.ImageFormat
import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CaptureRequest
import android.media.Image
import android.media.ImageReader
import android.os.Build
import android.util.Log
import android.util.Range
import android.util.Size
import android.view.Surface
import com.mrousavy.camera.parsers.getVideoStabilizationMode
import com.mrousavy.camera.utils.OutputType
import com.mrousavy.camera.utils.SessionType
import com.mrousavy.camera.utils.SurfaceOutput
import com.mrousavy.camera.utils.closestToOrMax
import com.mrousavy.camera.utils.createCaptureSession
import java.io.Closeable
import java.lang.IllegalStateException

data class PipelineConfiguration(val enabled: Boolean,
                                 val callback: (image: Image) -> Unit,
                                 val targetSize: Size? = null)

class CameraSession(private val device: CameraDevice,
                    private val captureSession: CameraCaptureSession,
                    private val outputs: List<SurfaceOutput>): Closeable {
  private var captureRequest: CaptureRequest = createCaptureRequestBuilder().build()

  private fun createCaptureRequestBuilder(): CaptureRequest.Builder {
    val captureRequest = device.createCaptureRequest(CameraDevice.TEMPLATE_MANUAL)
    outputs.forEach { output ->
      if (output.isRepeating) captureRequest.addTarget(output.surface)
    }
    return captureRequest
  }

  fun configureFormat(fps: Int? = null,
                      videoStabilizationMode: String? = null,
                      hdr: Boolean? = null,
                      lowLightBoost: Boolean? = null) {
    val captureRequest = createCaptureRequestBuilder()
    if (fps != null) {
      captureRequest.set(CaptureRequest.CONTROL_AE_TARGET_FPS_RANGE, Range(fps, fps))
    }
    if (videoStabilizationMode != null) {
      captureRequest.set(CaptureRequest.CONTROL_VIDEO_STABILIZATION_MODE, getVideoStabilizationMode(videoStabilizationMode))
    }
    if (lowLightBoost == true) {
      captureRequest.set(CaptureRequest.CONTROL_SCENE_MODE, CaptureRequest.CONTROL_SCENE_MODE_NIGHT)
    }
    if (hdr == true) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
        captureRequest.set(CaptureRequest.CONTROL_SCENE_MODE, CaptureRequest.CONTROL_SCENE_MODE_HDR)
      }
    }
    this.captureRequest = captureRequest.build()
  }


  fun startRunning() {
    Log.i(TAG, "Starting Camera Session...")
    try {
      // Start all repeating requests (Video, Frame Processor, Preview)
      captureSession.setRepeatingRequest(captureRequest, null, null)
    } catch (e: IllegalStateException) {
      Log.w(TAG, "Failed to start Camera Session, this session is already closed.")
    }
  }

  fun stopRunning() {
    Log.i(TAG, "Stopping Camera Session...")
    try {
      captureSession.stopRepeating()
    } catch (e: IllegalStateException) {
      Log.w(TAG, "Failed to stop Camera Session, this session is already closed.")
    }
  }

  override fun close() {
    stopRunning()
    captureSession.close()
  }

  companion object {
    private const val TAG = "CameraSession"
    suspend fun createCameraSession(device: CameraDevice,
                                    cameraManager: CameraManager,
                                    photoPipeline: PipelineConfiguration? = null,
                                    videoPipeline: PipelineConfiguration? = null,
                                    previewSurface: Surface? = null): CameraSession {
      val characteristics = cameraManager.getCameraCharacteristics(device.id)
      val config = characteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)!!

      val outputs = arrayListOf<SurfaceOutput>()

      if (videoPipeline != null) {
        // Video or Frame Processor output: High resolution repeating images
        val pixelFormat = ImageFormat.YUV_420_888
        val videoSize = config.getOutputSizes(pixelFormat).closestToOrMax(videoPipeline.targetSize)

        val imageReader = ImageReader.newInstance(videoSize.width, videoSize.height, pixelFormat, 2)
        imageReader.setOnImageAvailableListener({ reader ->
          val image = reader.acquireNextImage()
          if (image == null) {
            Log.w(CameraView.TAG, "Failed to get new Image from ImageReader, dropping a Frame...")
            return@setOnImageAvailableListener
          }

          videoPipeline.callback(image)
        }, CameraQueues.videoQueue.handler)

        Log.i(CameraView.TAG, "Adding ${videoSize.width}x${videoSize.height} video output. (Format: $pixelFormat)")
        val videoOutput = SurfaceOutput(imageReader.surface, OutputType.VIDEO)
        outputs.add(videoOutput)
        // TODO: Use reprocessable YUV capture session for more efficient Skia Frame Processing
      }

      if (photoPipeline != null) {
        // Photo output: High quality still images
        val pixelFormat = ImageFormat.JPEG
        val photoSize = config.getOutputSizes(pixelFormat).closestToOrMax(photoPipeline.targetSize)

        val imageReader = ImageReader.newInstance(photoSize.width, photoSize.height, pixelFormat, 1)
        imageReader.setOnImageAvailableListener({ reader ->
          val image = reader.acquireLatestImage()
          image.use {
            Log.d(CameraView.TAG, "Photo captured! ${image.width} x ${image.height}")
            photoPipeline.callback(image)
          }
        }, CameraQueues.cameraQueue.handler)

        Log.i(CameraView.TAG, "Adding ${photoSize.width}x${photoSize.height} photo output. (Format: $pixelFormat)")
        val photoOutput = SurfaceOutput(imageReader.surface, OutputType.PHOTO)
        outputs.add(photoOutput)
      }

      if (previewSurface != null) {
        // Preview output: Low resolution repeating images
        val previewOutput = SurfaceOutput(previewSurface, OutputType.PREVIEW)
        Log.i(CameraView.TAG, "Adding native preview view output.")
        outputs.add(previewOutput)
      }

      val captureSession = device.createCaptureSession(cameraManager, SessionType.REGULAR, outputs, CameraQueues.cameraQueue)

      Log.i(CameraView.TAG, "Successfully configured Camera Session!")
      return CameraSession(device, captureSession, outputs)
    }

  }
}


package com.mrousavy.camera

import android.annotation.SuppressLint
import android.hardware.camera2.*
import android.util.Log
import androidx.camera.camera2.interop.Camera2CameraInfo
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageProxy
import androidx.exifinterface.media.ExifInterface
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.mrousavy.camera.utils.*
import kotlinx.coroutines.*
import java.io.File

private const val TAG = "CameraView.performance"

@SuppressLint("UnsafeOptInUsageError")
suspend fun CameraView.takePhoto(options: ReadableMap): WritableMap = coroutineScope {
  val startFunc = System.nanoTime()
  Log.d(CameraView.REACT_CLASS, "takePhoto() called")
  val imageCapture = imageCapture ?: throw CameraNotReadyError()

  if (options.hasKey("flash")) {
    val flashMode = options.getString("flash")
    imageCapture.flashMode = when (flashMode) {
      "on" -> ImageCapture.FLASH_MODE_ON
      "off" -> ImageCapture.FLASH_MODE_OFF
      "auto" -> ImageCapture.FLASH_MODE_AUTO
      else -> throw InvalidTypeScriptUnionError("flash", flashMode ?: "(null)")
    }
  }
  // All those options are not yet implemented - see https://github.com/cuvent/react-native-vision-camera/issues/75
  if (options.hasKey("photoCodec")) {
    // TODO photoCodec
  }
  if (options.hasKey("qualityPrioritization")) {
    // TODO qualityPrioritization
  }
  if (options.hasKey("enableAutoRedEyeReduction")) {
    // TODO enableAutoRedEyeReduction
  }
  if (options.hasKey("enableDualCameraFusion")) {
    // TODO enableDualCameraFusion
  }
  if (options.hasKey("enableVirtualDeviceFusion")) {
    // TODO enableVirtualDeviceFusion
  }
  if (options.hasKey("enableAutoStabilization")) {
    // TODO enableAutoStabilization
  }
  if (options.hasKey("enableAutoDistortionCorrection")) {
    // TODO enableAutoDistortionCorrection
  }
  val skipMetadata = if (options.hasKey("skipMetadata")) options.getBoolean("skipMetadata") else false

  val camera2Info = Camera2CameraInfo.from(camera!!.cameraInfo)
  val lensFacing = camera2Info.getCameraCharacteristic(CameraCharacteristics.LENS_FACING)
  // TODO: Flip image if lens is front side - see https://github.com/cuvent/react-native-vision-camera/issues/74

  val results = awaitAll(
    async(coroutineContext) {
      Log.d(CameraView.REACT_CLASS, "Taking picture...")
      val startCapture = System.nanoTime()
      val pic = imageCapture.takePicture(takePhotoExecutor)
      val endCapture = System.nanoTime()
      Log.d(TAG, "Finished image capture in ${(endCapture - startCapture) / 1_000_000}ms")
      pic
    },
    async(Dispatchers.IO) {
      Log.d(CameraView.REACT_CLASS, "Creating temp file...")
      File.createTempFile("mrousavy", ".jpg", context.cacheDir).apply { deleteOnExit() }
    }
  )
  val photo = results.first { it is ImageProxy } as ImageProxy
  val file = results.first { it is File } as File

  val exif: ExifInterface?
  @Suppress("BlockingMethodInNonBlockingContext")
  withContext(Dispatchers.IO) {
    Log.d(CameraView.REACT_CLASS, "Saving picture to ${file.absolutePath}...")
    val startSave = System.nanoTime()
    photo.save(file, lensFacing == CameraCharacteristics.LENS_FACING_FRONT)
    val endSave = System.nanoTime()
    Log.d(TAG, "Finished image saving in ${(endSave - startSave) / 1_000_000}ms")
    // TODO: Read Exif from existing in-memory photo buffer instead of file?
    exif = if (skipMetadata) null else ExifInterface(file)
  }

  val map = Arguments.createMap()
  map.putString("path", file.absolutePath)
  map.putInt("width", photo.width)
  map.putInt("height", photo.height)
  map.putBoolean("isRawPhoto", photo.isRaw)

  val metadata = exif?.buildMetadataMap()
  map.putMap("metadata", metadata)

  photo.close()

  Log.d(CameraView.REACT_CLASS, "Finished taking photo!")

  val endFunc = System.nanoTime()
  Log.d(TAG, "Finished function execution in ${(endFunc - startFunc) / 1_000_000}ms")
  return@coroutineScope map
}

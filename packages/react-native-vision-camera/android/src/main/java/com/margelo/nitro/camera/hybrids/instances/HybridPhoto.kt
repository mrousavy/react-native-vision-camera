package com.margelo.nitro.camera.hybrids.instances

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.graphics.Matrix
import android.location.Location
import androidx.camera.core.ImageProxy
import androidx.camera.core.impl.utils.Exif
import com.margelo.nitro.camera.HybridCameraCalibrationDataSpec
import com.margelo.nitro.camera.HybridDepthSpec
import com.margelo.nitro.camera.HybridPhotoSpec
import com.margelo.nitro.camera.Orientation
import com.margelo.nitro.camera.PhotoContainerFormat
import com.margelo.nitro.camera.extensions.DisposableArrayBuffer
import com.margelo.nitro.camera.extensions.counterRotated
import com.margelo.nitro.camera.extensions.degrees
import com.margelo.nitro.camera.extensions.fileExtension
import com.margelo.nitro.camera.extensions.getPixelBuffer
import com.margelo.nitro.camera.extensions.hasPixelBuffer
import com.margelo.nitro.camera.extensions.isRAW
import com.margelo.nitro.camera.extensions.orientation
import com.margelo.nitro.camera.extensions.photoContainerFormat
import com.margelo.nitro.core.ArrayBuffer
import com.margelo.nitro.core.Promise
import com.margelo.nitro.image.HybridImage
import com.margelo.nitro.image.HybridImageSpec
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import java.io.File
import java.io.FileOutputStream

class HybridPhoto(
  val image: ImageProxy,
  override val isMirrored: Boolean,
  val location: Location?,
) : HybridPhotoSpec() {
  private val ioScope = CoroutineScope(Dispatchers.IO)

  override val width: Double
    get() = image.width.toDouble()
  override val height: Double
    get() = image.height.toDouble()

  override val orientation: Orientation
    get() = image.orientation
  override val timestamp: Double
    get() {
      val timestampNs = image.imageInfo.timestamp
      return timestampNs.toDouble() / 1_000_000_000.0
    }
  override val isRawPhoto: Boolean
    get() = image.isRAW

  override val containerFormat: PhotoContainerFormat
    get() = image.photoContainerFormat
  override val hasPixelBuffer: Boolean
    get() = image.hasPixelBuffer

  // TODO: When capturing Images with depth, how do we get the Depth?
  override val depth: HybridDepthSpec?
    get() = null

  // TODO: Get CameraCalibrationData somehow?
  override val calibrationData: HybridCameraCalibrationDataSpec?
    get() = null

  override val memorySize: Long
    get() = image.width * image.height * 4L

  override fun dispose() {
    super.dispose()
    image.close()
    cachedPixelBuffer?.dispose()
  }

  private var cachedPixelBuffer: DisposableArrayBuffer? = null

  override fun getPixelBuffer(): ArrayBuffer {
    cachedPixelBuffer?.let {
      // We have it cached
      return it.arrayBuffer
    }
    val pixelBuffer = image.getPixelBuffer()
    cachedPixelBuffer = pixelBuffer
    return pixelBuffer.arrayBuffer
  }

  private fun saveToFile(file: File) {
    when (image.format) {
      android.graphics.ImageFormat.JPEG -> {
        // JPEG Images have a single plane of image data.
        val plane = image.planes.single()
        val buffer = plane.buffer
        val bytes = ByteArray(buffer.remaining()).also { bytes -> buffer.get(bytes) }
        FileOutputStream(file).use { stream ->
          stream.write(bytes)
        }
        attachExifData(file)
      }
      else -> {
        // TODO: If the CameraX team implements https://issuetracker.google.com/u/3/issues/482079661,
        //       we could avoid manually reading the buffer and "just save the Photo to a file", just
        //       like on iOS via `AVCapturePhoto.fileDataRepresentation()` - no matter the format.
        throw Error(
          "Photos with ImageFormat \"${image.format}\" cannot be saved to a File " +
            "until https://issuetracker.google.com/u/3/issues/482079661 is implemented!",
        )
      }
    }
  }

  override fun saveToFileAsync(path: String): Promise<Unit> {
    return Promise.async(ioScope) {
      val file = File(path)
      saveToFile(file)
    }
  }

  override fun saveToTemporaryFileAsync(): Promise<String> {
    return Promise.async(ioScope) {
      val tempFile = File.createTempFile("VisionCamera_", containerFormat.fileExtension)
      saveToFile(tempFile)
      return@async tempFile.absolutePath
    }
  }

  override fun getFileData(): ArrayBuffer {
    when (image.format) {
      android.graphics.ImageFormat.JPEG -> {
        // JPEG Images have a single plane of image data.
        val plane = image.planes.single()
        return ArrayBuffer.wrap(plane.buffer)
      }
      else -> {
        // TODO: If the CameraX team implements https://issuetracker.google.com/u/3/issues/482079661,
        //       we could avoid manually reading the buffer and "just get the file data representation",
        //       just like on iOS via `AVCapturePhoto.fileDataRepresentation()` - no matter the format.
        throw Error(
          "Cannot get File Data for Photos with Image Format \"${image.format}\" " +
            "until https://issuetracker.google.com/u/3/issues/482079661 is implemented!",
        )
      }
    }
  }

  override fun getFileDataAsync(): Promise<ArrayBuffer> {
    return Promise.async { getFileData() }
  }

  override fun toImage(): HybridImageSpec {
    // TODO: This currently throws on RAW (DNG) Photos because only RGB and YUV is supported in toBitmap()
    //       If the CameraX team implements https://issuetracker.google.com/u/3/issues/482079661, this could
    //       work - just like on iOS via `AVCapturePhoto.cgImageRepresentation()`.
    val bitmap = image.toBitmap()

    val matrix =
      Matrix().apply {
        if (isMirrored) {
          preScale(-1f, 1f)
        }
        if (orientation != Orientation.UP) {
          val orientationToApply = orientation.counterRotated()
          postRotate(orientationToApply.degrees.toFloat())
        }
      }
    if (matrix.isIdentity) {
      // No transforms needed! Just return
      return HybridImage(bitmap)
    } else {
      // We need to transform the Bitmap
      val transformedBitmap = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, false)
      bitmap.recycle()
      return HybridImage(transformedBitmap)
    }
  }

  override fun toImageAsync(): Promise<HybridImageSpec> {
    return Promise.async { toImage() }
  }

  // TODO: If the CameraX team implements https://issuetracker.google.com/u/3/issues/482079661, we could
  //       stop manually writing EXIF (mirror + rotation + location), and instead rely on their new `Photo`
  //       type doing this metadata processing behind the scenes - just like on iOS.
  @SuppressLint("RestrictedApi")
  private fun attachExifData(file: File) {
    val exif = Exif.createFromFile(file)
    if (isMirrored) {
      exif.flipHorizontally()
    }
    if (orientation != Orientation.UP) {
      exif.rotate(orientation.degrees)
    }
    if (location != null) {
      exif.attachLocation(location)
    }
    exif.attachTimestamp()
    exif.save()
  }
}

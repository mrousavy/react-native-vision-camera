package com.mrousavy.camera.core

import android.hardware.HardwareBuffer
import android.media.Image
import android.os.Build
import androidx.annotation.OptIn
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageProxy
import com.facebook.proguard.annotations.DoNotStrip
import com.mrousavy.camera.core.types.Orientation
import com.mrousavy.camera.core.types.Orientation.Companion.fromRotationDegrees
import com.mrousavy.camera.core.types.PixelFormat
import com.mrousavy.camera.core.types.PixelFormat.Companion.fromImageFormat

class Frame(private val _imageProxy: ImageProxy) {
  private var refCount = 0

  private fun assertIsValid() {
    if (!getIsImageValid(imageProxy)) {
      throw FrameInvalidError()
    }
  }

  @Suppress("MemberVisibilityCanBePrivate")
  val imageProxy: ImageProxy
    get() {
      assertIsValid()
      return _imageProxy
    }

  @get:OptIn(ExperimentalGetImage::class)
  val image: Image
    get() = imageProxy.image ?: throw FrameInvalidError()

  @get:DoNotStrip
  @Suppress("unused")
  val width: Int
    get() = imageProxy.width

  @get:DoNotStrip
  @Suppress("unused")
  val height: Int
    get() = imageProxy.height

  @get:DoNotStrip
  @Suppress("unused")
  val isValid: Boolean
    get() = getIsImageValid(imageProxy)

  @get:DoNotStrip
  @Suppress("unused")
  val isMirrored: Boolean
    get() {
      val matrix = imageProxy.imageInfo.sensorToBufferTransformMatrix
      val values = FloatArray(9)
      matrix.getValues(values)
      // Check if the X scale factor is negative, indicating a horizontal flip.
      return values[0] < 0
    }

  @get:DoNotStrip
  @Suppress("unused")
  val timestamp: Long
    get() = imageProxy.imageInfo.timestamp

  @get:DoNotStrip
  @Suppress("unused")
  val orientation: Orientation
    get() {
      val degrees = imageProxy.imageInfo.rotationDegrees
      val orientation = fromRotationDegrees(degrees)
      // .rotationDegrees is the rotation that needs to be applied to make the image appear
      // upright. Our orientation is the actual orientation of the Frame, so the opposite. Reverse it.
      return orientation.reversed()
    }

  @get:DoNotStrip
  @Suppress("unused")
  val pixelFormat: PixelFormat
    get() = fromImageFormat(imageProxy.format)

  @get:DoNotStrip
  @Suppress("unused")
  val planesCount: Int
    get() = imageProxy.planes.size

  @get:DoNotStrip
  @Suppress("unused")
  val bytesPerRow: Int
    get() = imageProxy.planes[0].rowStride

  @get:DoNotStrip
  @Suppress("unused")
  private val hardwareBufferBoxed: Any?
    get() = hardwareBuffer

  @Suppress("unused", "MemberVisibilityCanBePrivate")
  val hardwareBuffer: HardwareBuffer?
    get() {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
        throw HardwareBuffersNotAvailableError()
      }
      return image.hardwareBuffer
    }

  @Synchronized
  private fun getIsImageValid(image: ImageProxy): Boolean {
    if (refCount <= 0) return false
    try {
      // will throw an exception if the image is already closed
      image.format
      // no exception thrown, image must still be valid.
      return true
    } catch (e: IllegalStateException) {
      // exception thrown, image has already been closed.
      return false
    }
  }

  @Suppress("unused")
  @DoNotStrip
  @Synchronized
  fun incrementRefCount() {
    refCount++
  }

  @Suppress("unused")
  @DoNotStrip
  @Synchronized
  fun decrementRefCount() {
    refCount--
    if (refCount <= 0) {
      // If no reference is held on this Image, close it.
      close()
    }
  }

  private fun close() {
    _imageProxy.close()
  }
}

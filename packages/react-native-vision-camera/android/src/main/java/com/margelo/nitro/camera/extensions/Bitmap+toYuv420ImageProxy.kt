package com.margelo.nitro.camera.extensions

import android.graphics.Bitmap
import android.graphics.ImageFormat
import android.hardware.DataSpace
import android.hardware.HardwareBuffer
import android.media.Image
import android.media.ImageReader
import android.media.ImageWriter
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import com.margelo.nitro.camera.utils.StaticImageProxy
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import kotlin.math.roundToInt

private const val MAX_IMAGES = 2
private const val ACQUIRE_TIMEOUT_SECONDS = 5L

/**
 * Renders this [Bitmap] into a new YUV 4:2:0 full-range [Image]
 * (the same format the Camera streams Frames in), using an
 * [ImageReader]/[ImageWriter] pair.
 *
 * The returned [StaticImageProxy] owns the [Image] and its [ImageReader],
 * and has to be closed again to free up its memory.
 */
fun Bitmap.toYuv420ImageProxy(rotationDegrees: Int): StaticImageProxy {
  val imageReader = createYuv420ImageReader(width, height)
  var imageWriter: ImageWriter? = null
  var handlerThread: HandlerThread? = null
  try {
    val imageAvailable = CountDownLatch(1)
    val thread = HandlerThread("VisionCamera-ImageToFrame").apply { start() }
    handlerThread = thread
    imageReader.setOnImageAvailableListener({ imageAvailable.countDown() }, Handler(thread.looper))

    val writer = ImageWriter.newInstance(imageReader.surface, MAX_IMAGES)
    imageWriter = writer
    val inputImage = writer.dequeueInputImage()
    inputImage.timestamp = System.nanoTime()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      // BT.601 full-range - the same coefficients writeYuv420Into uses.
      inputImage.dataSpace = DataSpace.DATASPACE_JFIF
    }
    writeYuv420Into(inputImage)
    writer.queueInputImage(inputImage)

    // The buffer is delivered to the ImageReader asynchronously - it is
    // usually available immediately, but wait for the callback if it isn't.
    var image = imageReader.acquireNextImage()
    if (image == null) {
      imageAvailable.await(ACQUIRE_TIMEOUT_SECONDS, TimeUnit.SECONDS)
      image = imageReader.acquireNextImage()
        ?: throw Error("Failed to acquire the converted YUV Image from the ImageReader!")
    }
    imageReader.setOnImageAvailableListener(null, null)
    return StaticImageProxy(image, imageReader, rotationDegrees)
  } catch (error: Throwable) {
    imageReader.close()
    throw error
  } finally {
    imageWriter?.close()
    handlerThread?.quitSafely()
  }
}

private fun createYuv420ImageReader(
  width: Int,
  height: Int,
): ImageReader {
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
    // Allocate the buffer with GPU-sampling support so the resulting
    // Frame can also be used in GPU pipelines (e.g. the Resizer).
    val usage =
      HardwareBuffer.USAGE_CPU_READ_OFTEN or
        HardwareBuffer.USAGE_CPU_WRITE_OFTEN or
        HardwareBuffer.USAGE_GPU_SAMPLED_IMAGE
    return ImageReader.newInstance(width, height, ImageFormat.YUV_420_888, MAX_IMAGES, usage)
  }
  return ImageReader.newInstance(width, height, ImageFormat.YUV_420_888, MAX_IMAGES)
}

/**
 * Writes this [Bitmap]'s pixels into the given YUV 4:2:0 [image],
 * converting RGB -> YUV with BT.601 full-range coefficients.
 */
private fun Bitmap.writeYuv420Into(image: Image) {
  val width = image.width
  val height = image.height
  val pixels = IntArray(width * height)
  getPixels(pixels, 0, width, 0, 0, width, height)

  val yPlane = image.planes[0]
  val yBuffer = yPlane.buffer
  val yRowStride = yPlane.rowStride
  val yPixelStride = yPlane.pixelStride
  for (y in 0 until height) {
    for (x in 0 until width) {
      val argb = pixels[y * width + x]
      val r = (argb shr 16) and 0xFF
      val g = (argb shr 8) and 0xFF
      val b = argb and 0xFF
      val luma = (0.299 * r + 0.587 * g + 0.114 * b).roundToInt().coerceIn(0, 255)
      yBuffer.put(y * yRowStride + x * yPixelStride, luma.toByte())
    }
  }

  // The chroma planes are half resolution - average each 2x2 block of pixels.
  val uPlane = image.planes[1]
  val vPlane = image.planes[2]
  val uBuffer = uPlane.buffer
  val vBuffer = vPlane.buffer
  val chromaWidth = (width + 1) / 2
  val chromaHeight = (height + 1) / 2
  for (chromaY in 0 until chromaHeight) {
    for (chromaX in 0 until chromaWidth) {
      var totalR = 0
      var totalG = 0
      var totalB = 0
      var samples = 0
      for (offsetY in 0 until 2) {
        for (offsetX in 0 until 2) {
          val x = chromaX * 2 + offsetX
          val y = chromaY * 2 + offsetY
          if (x >= width || y >= height) continue
          val argb = pixels[y * width + x]
          totalR += (argb shr 16) and 0xFF
          totalG += (argb shr 8) and 0xFF
          totalB += argb and 0xFF
          samples++
        }
      }
      val r = totalR.toDouble() / samples
      val g = totalG.toDouble() / samples
      val b = totalB.toDouble() / samples
      val u = (-0.168736 * r - 0.331264 * g + 0.5 * b + 128.0).roundToInt().coerceIn(0, 255)
      val v = (0.5 * r - 0.418688 * g - 0.081312 * b + 128.0).roundToInt().coerceIn(0, 255)
      uBuffer.put(chromaY * uPlane.rowStride + chromaX * uPlane.pixelStride, u.toByte())
      vBuffer.put(chromaY * vPlane.rowStride + chromaX * vPlane.pixelStride, v.toByte())
    }
  }
}

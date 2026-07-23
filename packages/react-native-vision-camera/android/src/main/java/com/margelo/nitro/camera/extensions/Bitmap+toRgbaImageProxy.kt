package com.margelo.nitro.camera.extensions

import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.hardware.HardwareBuffer
import android.media.ImageReader
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import com.margelo.nitro.camera.utils.StaticImageProxy
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

private const val MAX_IMAGES = 2
private const val ACQUIRE_TIMEOUT_SECONDS = 5L

/**
 * Renders this [Bitmap] into a new RGBA_8888 [android.media.Image]
 * (a camera-like, CPU-accessible format), using an [ImageReader].
 *
 * RGBA is used instead of YUV here because CPU-written flexible-YUV
 * buffers are sampled with swapped chroma planes by some GPU drivers -
 * RGBA has no plane-order ambiguity, and GPU pipelines (e.g. the Resizer)
 * support any AHardwareBuffer format on Android anyways.
 *
 * The returned [StaticImageProxy] owns the [android.media.Image] and its
 * [ImageReader], and has to be closed again to free up its memory.
 */
fun Bitmap.toRgbaImageProxy(rotationDegrees: Int): StaticImageProxy {
  val imageReader = createRgbaImageReader(width, height)
  var handlerThread: HandlerThread? = null
  try {
    val imageAvailable = CountDownLatch(1)
    val thread = HandlerThread("VisionCamera-ImageToFrame").apply { start() }
    handlerThread = thread
    imageReader.setOnImageAvailableListener({ imageAvailable.countDown() }, Handler(thread.looper))

    // Draw the Bitmap 1:1 into the ImageReader's Surface using a software
    // Canvas - a deterministic, byte-exact copy of the pixels.
    val surface = imageReader.surface
    val canvas = surface.lockCanvas(null)
    try {
      canvas.drawBitmap(this, 0f, 0f, null)
    } finally {
      surface.unlockCanvasAndPost(canvas)
    }

    // The buffer is delivered to the ImageReader asynchronously - it is
    // usually available immediately, but wait for the callback if it isn't.
    var image = imageReader.acquireNextImage()
    if (image == null) {
      imageAvailable.await(ACQUIRE_TIMEOUT_SECONDS, TimeUnit.SECONDS)
      image = imageReader.acquireNextImage()
        ?: throw Error("Failed to acquire the converted RGBA Image from the ImageReader!")
    }
    imageReader.setOnImageAvailableListener(null, null)
    return StaticImageProxy(image, imageReader, rotationDegrees)
  } catch (error: Throwable) {
    imageReader.close()
    throw error
  } finally {
    handlerThread?.quitSafely()
  }
}

private fun createRgbaImageReader(
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
    return ImageReader.newInstance(width, height, PixelFormat.RGBA_8888, MAX_IMAGES, usage)
  }
  return ImageReader.newInstance(width, height, PixelFormat.RGBA_8888, MAX_IMAGES)
}

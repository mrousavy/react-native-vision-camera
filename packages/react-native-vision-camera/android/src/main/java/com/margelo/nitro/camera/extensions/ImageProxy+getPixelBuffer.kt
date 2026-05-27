package com.margelo.nitro.camera.extensions

import android.os.Build
import android.util.Log
import androidx.annotation.OptIn
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageProxy
import com.margelo.nitro.camera.utils.DirectByteBufferPool
import com.margelo.nitro.core.ArrayBuffer
import java.nio.ByteBuffer

val ImageProxy.hasPixelBuffer: Boolean
  @OptIn(ExperimentalGetImage::class)
  get() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      image?.hardwareBuffer?.use {
        // We have a buffer - return true
        return true
      }
    }
    if (planes.size >= 1) {
      // We have CPU accessible planes
      return true
    }
    // We have nothing.
    return false
  }

data class DisposableArrayBuffer(
  val arrayBuffer: ArrayBuffer,
  val dispose: () -> Unit,
)

private fun ByteBuffer.wrapOrCopyIntoArrayBuffer(): DisposableArrayBuffer {
  val buffer = readableBytes()
  if (buffer.isDirect) {
    val arrayBuffer = ArrayBuffer.wrap(buffer)
    return DisposableArrayBuffer(arrayBuffer) {
      // no release
    }
  }

  val directBuffer = DirectByteBufferPool.Shared.acquire(buffer.remaining())
  directBuffer.put(buffer)
  val arrayBuffer = ArrayBuffer.wrap(directBuffer)
  return DisposableArrayBuffer(arrayBuffer) {
    DirectByteBufferPool.Shared.release(directBuffer)
  }
}

@OptIn(ExperimentalGetImage::class)
fun ImageProxy.getPixelBuffer(): DisposableArrayBuffer {
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
    image?.hardwareBuffer?.use { hardwareBuffer ->
      try {
        // Fast Path: We have a GPU-accessible Buffer
        val arrayBuffer = ArrayBuffer.wrap(hardwareBuffer)
        return DisposableArrayBuffer(arrayBuffer) {
          // no release
        }
      } catch (e: Throwable) {
        Log.e("ImageProxy", "Failed to wrap zero-copy HardwareBuffer! Falling back to ByteBuffer copy...", e)
      }
    }
  }
  when {
    planes.size == 1 -> {
      // Medium Path: We can wrap a single direct plane as a ByteBuffer, or copy it into one if needed.
      return planes.single().buffer.wrapOrCopyIntoArrayBuffer()
    }
    planes.size > 1 -> {
      // Slow Path: We have to copy all planes into a new ByteBuffer.
      val buffers = planes.map { plane -> plane.buffer.readableBytes() }
      val totalBytes = buffers.sumOf { buffer -> buffer.remaining() }
      val byteBuffer = DirectByteBufferPool.Shared.acquire(totalBytes)
      for (buffer in buffers) {
        byteBuffer.put(buffer)
      }
      val arrayBuffer = ArrayBuffer.wrap(byteBuffer)
      return DisposableArrayBuffer(arrayBuffer) {
        DirectByteBufferPool.Shared.release(byteBuffer)
      }
    }
    else -> throw Error("ImageProxy does not contain any GPU- or CPU-Pixel Data!")
  }
}

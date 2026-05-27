package com.margelo.nitro.camera.extensions

import android.hardware.HardwareBuffer
import android.os.Build
import androidx.annotation.OptIn
import androidx.annotation.RequiresApi
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageProxy
import com.margelo.nitro.camera.utils.DirectByteBufferPool
import com.margelo.nitro.core.ArrayBuffer
import java.nio.ByteBuffer

private val HardwareBuffer.isCpuReadable: Boolean
  @RequiresApi(Build.VERSION_CODES.O)
  get() {
    val readableUsageFlags = HardwareBuffer.USAGE_CPU_READ_RARELY or HardwareBuffer.USAGE_CPU_READ_OFTEN
    return (usage and readableUsageFlags) != 0L
  }

@OptIn(ExperimentalGetImage::class)
private inline fun <T : Any> ImageProxy.withReadableHardwareBuffer(block: (HardwareBuffer) -> T): T? {
  if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) return null
  val hardwareBuffer = image?.hardwareBuffer ?: return null
  return hardwareBuffer.use { buffer ->
    if (buffer.isCpuReadable) {
      block(buffer)
    } else {
      null
    }
  }
}

val ImageProxy.hasPixelBuffer: Boolean
  @OptIn(ExperimentalGetImage::class)
  get() {
    return withReadableHardwareBuffer { true } ?: planes.isNotEmpty()
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
  withReadableHardwareBuffer { hardwareBuffer ->
    // Fast Path: We have a CPU-readable HardwareBuffer.
    val arrayBuffer = ArrayBuffer.wrap(hardwareBuffer)
    DisposableArrayBuffer(arrayBuffer) {
      // no release
    }
  }?.let { arrayBuffer ->
    return arrayBuffer
  }

  return when {
    planes.size == 1 -> {
      // Medium Path: We can wrap a single direct plane as a ByteBuffer, or copy it into one if needed.
      planes.single().buffer.wrapOrCopyIntoArrayBuffer()
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
      DisposableArrayBuffer(arrayBuffer) {
        DirectByteBufferPool.Shared.release(byteBuffer)
      }
    }
    else -> throw Error("ImageProxy does not contain any readable Pixel Data!")
  }
}

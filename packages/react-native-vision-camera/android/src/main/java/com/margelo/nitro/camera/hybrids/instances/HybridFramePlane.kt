package com.margelo.nitro.camera.hybrids.instances

import androidx.camera.core.ImageProxy
import com.margelo.nitro.camera.HybridFramePlaneSpec
import com.margelo.nitro.camera.utils.DirectByteBufferPool
import com.margelo.nitro.core.ArrayBuffer
import java.nio.ByteBuffer

class HybridFramePlane(
  val plane: ImageProxy.PlaneProxy,
) : HybridFramePlaneSpec() {
  override val width: Double
    get() = plane.rowStride.toDouble() / plane.pixelStride.toDouble()
  override val height: Double
    get() = bytesCount.toDouble() / plane.rowStride.toDouble()
  override val bytesPerRow: Double
    get() = plane.rowStride.toDouble()
  override val isValid: Boolean
    get() {
      try {
        plane.buffer
        return true
      } catch (_: Throwable) {
        return false
      }
    }

  private val bytesCount: Int
    get() = plane.buffer.capacity()

  private var cachedBuffer: ByteBuffer? = null
  private val buffer: ByteBuffer
    get() {
      if (plane.buffer.isDirect) {
        return plane.buffer
      } else {
        cachedBuffer?.let {
          // We already have it cached
          return it
        }
        val size = plane.buffer.capacity()
        val copy = DirectByteBufferPool.Shared.acquire(size)
        copy.put(plane.buffer)
        cachedBuffer = copy
        return copy
      }
    }

  override val memorySize: Long
    get() = plane.buffer.capacity().toLong()

  override fun getPixelBuffer(): ArrayBuffer {
    return ArrayBuffer.wrap(buffer)
  }

  override fun dispose() {
    super.dispose()
    cachedBuffer?.let {
      DirectByteBufferPool.Shared.release(it)
    }
  }
}

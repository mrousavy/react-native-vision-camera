package com.margelo.nitro.camera.utils

import java.nio.ByteBuffer
import java.util.ArrayDeque
import java.util.IdentityHashMap
import java.util.concurrent.locks.ReentrantLock
import kotlin.concurrent.withLock

/**
 * Thread-safe pool for DIRECT ByteBuffers with EXACT capacity matching.
 *
 * - acquire(size): returns a direct ByteBuffer with capacity == size (or allocates a new one).
 * - release(buffer) / dispose(buffer): returns it to the pool (or drops it if pool is full).
 *
 * The returned buffer is always cleared (position=0, limit=capacity).
 */
class DirectByteBufferPool(
  private val maxRetained: Int = DEFAULT_MAX_RETAINED,
) {
  init {
    require(maxRetained >= 0) { "maxRetained must be >= 0" }
  }

  private val lock = ReentrantLock()

  // capacity -> queue of buffers with exactly that capacity
  private val buckets = HashMap<Int, ArrayDeque<ByteBuffer>>()

  // identity tracking to prevent double-release
  private val inPool = IdentityHashMap<ByteBuffer, Unit>()

  // total number of retained buffers across all buckets
  private var retainedCount: Int = 0

  /**
   * Acquire a direct ByteBuffer of EXACT capacity [size].
   * Allocates a new direct buffer if none is available in the pool.
   */
  fun acquire(size: Int): ByteBuffer {
    require(size >= 0) { "size must be >= 0" }

    lock.withLock {
      val q = buckets[size]
      if (q != null && q.isNotEmpty()) {
        val buffer = q.removeFirst()
        inPool.remove(buffer)
        retainedCount--
        buffer.clear()
        return buffer
      }
    }

    return ByteBuffer.allocateDirect(size)
  }

  /**
   * Return [buffer] to the pool.
   *
   * If the pool is full (>= maxRetained), the buffer is dropped.
   */
  fun release(buffer: ByteBuffer) {
    // Make it ready for reuse (keep ByteBuffer type).
    buffer.clear()

    lock.withLock {
      // Guard against double-release.
      if (inPool.containsKey(buffer)) return

      if (maxRetained == 0 || retainedCount >= maxRetained) {
        // Drop it; eligible for GC/cleaner.
        return
      }

      val cap = buffer.capacity()
      val q = buckets.getOrPut(cap) { ArrayDeque() }
      q.addLast(buffer)
      inPool[buffer] = Unit
      retainedCount++
    }
  }

  fun clear() {
    lock.withLock {
      buckets.clear()
      inPool.clear()
      retainedCount = 0
    }
  }

  companion object {
    const val DEFAULT_MAX_RETAINED: Int = 12
    val Shared = DirectByteBufferPool()
  }
}

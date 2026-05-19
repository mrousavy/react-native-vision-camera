package com.margelo.nitro.camera.extensions

import java.nio.ByteBuffer

/**
 * Returns this buffer's readable contents as an independent view.
 *
 * The returned view has its own cursor, so reading from it does not change
 * this buffer's position.
 */
fun ByteBuffer.readableBytes(): ByteBuffer {
  val view = duplicate()
  view.rewind()
  return view
}

/**
 * Number of bytes in this buffer's readable contents.
 */
val ByteBuffer.readableByteCount: Int
  get() = readableBytes().remaining()

/**
 * Copies this buffer's readable contents into [destination].
 */
fun ByteBuffer.copyReadableBytesTo(destination: ByteBuffer) {
  destination.put(readableBytes())
}

/**
 * Replaces this buffer's contents with [source]'s readable contents.
 */
fun ByteBuffer.replaceWithReadableBytesFrom(source: ByteBuffer): ByteBuffer {
  clear()
  source.copyReadableBytesTo(this)
  flip()
  return this
}

/**
 * Replaces this buffer's contents with all readable contents from [sources].
 */
fun ByteBuffer.replaceWithReadableBytesFrom(sources: Iterable<ByteBuffer>): ByteBuffer {
  clear()
  for (source in sources) {
    source.copyReadableBytesTo(this)
  }
  flip()
  return this
}

/**
 * Copies this buffer's readable contents into a new ByteArray.
 */
fun ByteBuffer.toReadableByteArray(): ByteArray {
  val view = readableBytes()
  val bytes = ByteArray(view.remaining())
  view.get(bytes)
  return bytes
}

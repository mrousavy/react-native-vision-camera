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
  return view.slice()
}

/**
 * Number of bytes in this buffer's readable contents.
 */
val ByteBuffer.readableByteCount: Int
  get() = readableBytes().remaining()

/**
 * Copies this buffer's readable contents into a new ByteArray.
 */
fun ByteBuffer.toReadableByteArray(): ByteArray {
  val view = readableBytes()
  val bytes = ByteArray(view.remaining())
  view.get(bytes)
  return bytes
}

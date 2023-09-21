package com.mrousavy.camera.core

import android.media.Image
import kotlinx.coroutines.CompletableDeferred

class PhotoOutputSynchronizer {
  private val photoOutputQueue = HashMap<Long, CompletableDeferred<Image>>()

  private operator fun get(key: Long): CompletableDeferred<Image> {
    if (!photoOutputQueue.containsKey(key)) {
      photoOutputQueue[key] = CompletableDeferred()
    }
    return photoOutputQueue[key]!!
  }

  suspend fun await(timestamp: Long): Image {
    val image = this[timestamp].await()
    photoOutputQueue.remove(timestamp)
    return image
  }

  fun set(timestamp: Long, image: Image) {
    this[timestamp].complete(image)
  }

  fun clear() {
    photoOutputQueue.forEach {
      it.value.cancel()
    }
    photoOutputQueue.clear()
  }
}

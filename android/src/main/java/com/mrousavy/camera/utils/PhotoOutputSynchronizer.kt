package com.mrousavy.camera.utils;

import android.media.Image
import kotlinx.coroutines.CompletableDeferred

class PhotoOutputSynchronizer {
  private val photoOutputQueue = HashMap<Long, CompletableDeferred<Image>>()

  operator fun get(key: Long): CompletableDeferred<Image> {
    if (!photoOutputQueue.containsKey(key)) {
      photoOutputQueue[key] = CompletableDeferred()
    }
    return photoOutputQueue[key]!!
  }

  fun set(key: Long, image: Image) {
    this[key].complete(image)
  }

  fun clear() {
    photoOutputQueue.forEach {
      it.value.cancel()
    }
    photoOutputQueue.clear()
  }
}

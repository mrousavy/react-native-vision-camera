package com.mrousavy.camera.extensions

import android.os.Handler
import java.util.concurrent.Semaphore

/**
 * Posts a Message to this Handler and blocks the calling Thread until the Handler finished executing the given job.
 */
fun Handler.postAndWait(job: () -> Unit) {
  val semaphore = Semaphore(0)

  this.post {
    try {
      job()
    } finally {
      semaphore.release()
    }
  }

  semaphore.acquire()
}

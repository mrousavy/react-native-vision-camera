package com.margelo.nitro.camera.utils

import java.util.concurrent.Executor
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicReference

class IdentifiableExecutor(
  name: String,
) : Executor {
  private val threadRef = AtomicReference<Thread?>()
  private val executor =
    Executors.newSingleThreadExecutor { runnable ->
      val thread = Thread(runnable, name)
      threadRef.set(thread)
      return@newSingleThreadExecutor thread
    }

  override fun execute(command: Runnable?) {
    executor.execute(command)
  }

  val isRunningOnExecutor: Boolean
    get() = Thread.currentThread() == threadRef.get()
}

package com.margelo.nitro.camera.hybrids

import com.margelo.nitro.camera.HybridNativeThreadSpec
import java.util.concurrent.Executor

class HybridNativeThread(
  val executor: Executor,
) : HybridNativeThreadSpec() {
  override val id: String
    get() = executor.toString()

  override fun runOnThread(task: () -> Unit) {
    executor.execute(task)
  }
}

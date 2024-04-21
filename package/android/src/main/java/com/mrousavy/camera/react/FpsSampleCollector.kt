package com.mrousavy.camera.react

import java.util.Timer
import kotlin.concurrent.schedule

class FpsSampleCollector(val callback: Callback) {
  private var timestamps = mutableListOf<Long>()
  private val timer = Timer("VisionCamera FPS Sample Collector")

  fun start() {
    timer.schedule(1000, 1000) {
      callback.onAverageFpsChanged(averageFps)
    }
  }

  fun stop() {
    timer.cancel()
  }

  fun onTick() {
    val now = System.currentTimeMillis()
    timestamps.add(now)

    timestamps = timestamps.filter { timestamp ->
      val differenceMs = now - timestamp
      return@filter differenceMs < 1000
    }.toMutableList()
  }

  private val averageFps: Double
    get() {
      val first = timestamps.firstOrNull()
      val last = timestamps.lastOrNull()
      if (first == null || last == null) return 0.0

      val totalDurationMs = last - first
      val averageFrameDurationMs = totalDurationMs.toDouble() / (timestamps.count() - 1).toDouble()
      return 1000.0 / averageFrameDurationMs
    }

  interface Callback {
    fun onAverageFpsChanged(averageFps: Double)
  }
}

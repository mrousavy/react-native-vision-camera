package com.mrousavy.camera.frameprocessor

data class PerformanceSampleCollection(val endPerformanceSampleCollection: () -> Unit)

class FrameProcessorPerformanceDataCollector(private val maxSampleSize: Int) {
  private var counter = 0
  private var performanceSamples: ArrayList<Double> = ArrayList()

  val averageExecutionTimeSeconds: Double
    get() = performanceSamples.average()

  fun beginPerformanceSampleCollection(): PerformanceSampleCollection {
    val begin = System.currentTimeMillis()

    return PerformanceSampleCollection {
      val end = System.currentTimeMillis()
      val seconds = (end - begin) / 1_000.0

      val index = counter % maxSampleSize

      if (performanceSamples.size > index) {
        performanceSamples[index] = seconds
      } else {
        performanceSamples.add(seconds)
      }

      counter++
    }
  }
}

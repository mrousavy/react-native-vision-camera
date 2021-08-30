package com.mrousavy.camera.frameprocessor

data class PerformanceSampleCollection(val endPerformanceSampleCollection: () -> Unit)

class FrameProcessorPerformanceDataCollector(private val maxSampleSize: Int) {
  private var counter = 0
  private var lastEvaluation = -1
  private var performanceSamples: DoubleArray = DoubleArray(maxSampleSize) { 0.0 }

  val averageExecutionTimeSeconds: Double
    get() {
      val sum = performanceSamples.sum()
      val average = sum / performanceSamples.size.toDouble()

      lastEvaluation = counter

      return average
    }

  val hasEnoughData: Boolean
    get() {
      return counter >= maxSampleSize
    }

  val isReadyForNewEvaluation: Boolean
    get() {
      return hasEnoughData && counter % maxSampleSize == 0 && lastEvaluation != counter
    }

  fun beginPerformanceSampleCollection(): PerformanceSampleCollection {
    val begin = System.currentTimeMillis()

    return PerformanceSampleCollection {
      val end = System.currentTimeMillis()
      val seconds = (end - begin) / 1_000.0

      val index = counter % maxSampleSize
      performanceSamples[index] = seconds
      counter++
    }
  }
}

package com.mrousavy.camera.utils

import android.util.Range
import android.util.Size
import com.facebook.react.bridge.ReadableMap

class DeviceFormat(map: ReadableMap) {
  val frameRateRanges: List<Range<Int>>
  val photoSize: Size
  val videoSize: Size

  init {
    frameRateRanges = map.getArray("frameRateRanges")!!.toArrayList().map { range ->
      if (range is HashMap<*, *>)
        rangeFactory(range["minFrameRate"], range["maxFrameRate"])
      else
        throw IllegalArgumentException("DeviceFormat: frameRateRanges contained a Range that was not of type HashMap<*,*>! Actual Type: ${range?.javaClass?.name}")
    }
    photoSize = Size(map.getInt("photoWidth"), map.getInt("photoHeight"))
    videoSize = Size(map.getInt("videoWidth"), map.getInt("videoHeight"))
  }
}

fun rangeFactory(minFrameRate: Any?, maxFrameRate: Any?): Range<Int> {
  return when (minFrameRate) {
    is Int -> Range(minFrameRate, maxFrameRate as Int)
    is Double -> Range(minFrameRate.toInt(), (maxFrameRate as Double).toInt())
    else -> throw IllegalArgumentException(
      "DeviceFormat: frameRateRanges contained a Range that didn't have minFrameRate/maxFrameRate of types Int/Double! " +
        "Actual Type: ${minFrameRate?.javaClass?.name} & ${maxFrameRate?.javaClass?.name}"
    )
  }
}

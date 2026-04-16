package com.margelo.nitro.camera.extensions.converters

import com.margelo.nitro.camera.ColorRange
import com.margelo.nitro.camera.ColorSpace
import com.margelo.nitro.camera.DynamicRange
import com.margelo.nitro.camera.DynamicRangeBitDepth

fun DynamicRange.Companion.from(dynamicRange: androidx.camera.core.DynamicRange): DynamicRange {
  val bitDepth =
    when (dynamicRange.bitDepth) {
      androidx.camera.core.DynamicRange.BIT_DEPTH_8_BIT -> DynamicRangeBitDepth.SDR_8_BIT
      androidx.camera.core.DynamicRange.BIT_DEPTH_10_BIT -> DynamicRangeBitDepth.HDR_10_BIT
      else -> DynamicRangeBitDepth.UNKNOWN
    }
  // TODO: HDR10 and HDR10_PLUS are not exposed to JS! This is wrong.
  val colorSpace =
    when (dynamicRange.encoding) {
      androidx.camera.core.DynamicRange.ENCODING_SDR -> ColorSpace.SRGB
      androidx.camera.core.DynamicRange.ENCODING_HLG -> ColorSpace.HLG_BT2020
      androidx.camera.core.DynamicRange.ENCODING_HDR10 -> ColorSpace.HLG_BT2020
      androidx.camera.core.DynamicRange.ENCODING_HDR10_PLUS -> ColorSpace.HLG_BT2020
      androidx.camera.core.DynamicRange.ENCODING_DOLBY_VISION -> ColorSpace.DOLBY_VISION
      else -> ColorSpace.UNKNOWN
    }
  // TODO: Is DynamicRange on Android always ColorRange.FULL?
  val colorRange = ColorRange.FULL
  return DynamicRange(bitDepth, colorSpace, colorRange)
}

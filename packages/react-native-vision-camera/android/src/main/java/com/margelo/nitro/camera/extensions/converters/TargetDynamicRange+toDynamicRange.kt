package com.margelo.nitro.camera.extensions.converters

import androidx.camera.core.DynamicRange
import com.margelo.nitro.camera.TargetColorSpace
import com.margelo.nitro.camera.TargetDynamicRange
import com.margelo.nitro.camera.TargetDynamicRangeBitDepth

fun TargetDynamicRange.toDynamicRange(): DynamicRange {
  when (this.bitDepth) {
    TargetDynamicRangeBitDepth.SDR_8_BIT -> {
      return when (this.colorSpace) {
        TargetColorSpace.DOLBY_VISION -> DynamicRange.DOLBY_VISION_8_BIT
        else -> DynamicRange.SDR
      }
    }
    TargetDynamicRangeBitDepth.HDR_10_BIT -> {
      return when (this.colorSpace) {
        TargetColorSpace.DOLBY_VISION -> DynamicRange.DOLBY_VISION_10_BIT
        TargetColorSpace.HLG_BT2020 -> DynamicRange.HLG_10_BIT
        else -> DynamicRange.HDR_UNSPECIFIED_10_BIT
      }
    }
  }
}

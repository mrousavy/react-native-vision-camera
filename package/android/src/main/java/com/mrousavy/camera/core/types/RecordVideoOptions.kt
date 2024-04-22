package com.mrousavy.camera.core.types

import com.facebook.react.bridge.ReadableMap

class RecordVideoOptions(map: ReadableMap) {
  var fileType: VideoFileType = VideoFileType.MOV
  var videoCodec = VideoCodec.H264
  var videoBitRateOverride: Double? = null
  var videoBitRateMultiplier: Double? = null

  init {
    if (map.hasKey("fileType")) {
      fileType = VideoFileType.fromUnionValue(map.getString("fileType"))
    }
    if (map.hasKey("videoCodec")) {
      videoCodec = VideoCodec.fromUnionValue(map.getString("videoCodec"))
    }
    if (map.hasKey("videoBitRateOverride")) {
      videoBitRateOverride = map.getDouble("videoBitRateOverride")
    }
    if (map.hasKey("videoBitRateMultiplier")) {
      videoBitRateMultiplier = map.getDouble("videoBitRateMultiplier")
    }
  }
}

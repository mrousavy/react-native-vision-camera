package com.mrousavy.camera.extensions

import android.hardware.camera2.params.DynamicRangeProfiles
import android.media.MediaCodecInfo
import android.media.MediaFormat
import android.os.Build
import android.util.Log
import androidx.annotation.RequiresApi

@RequiresApi(Build.VERSION_CODES.N)
private fun getTransferFunction(codecProfile: Int) = when (codecProfile) {
  MediaCodecInfo.CodecProfileLevel.HEVCProfileMain10 -> MediaFormat.COLOR_TRANSFER_HLG
  MediaCodecInfo.CodecProfileLevel.HEVCProfileMain10HDR10 -> MediaFormat.COLOR_TRANSFER_ST2084
  MediaCodecInfo.CodecProfileLevel.HEVCProfileMain10HDR10Plus -> MediaFormat.COLOR_TRANSFER_ST2084
  else -> MediaFormat.COLOR_TRANSFER_SDR_VIDEO
}

fun MediaFormat.setDynamicRangeProfile(dynamicRangeProfile: Long) {
  val profile = when (dynamicRangeProfile) {
    DynamicRangeProfiles.HLG10 -> MediaCodecInfo.CodecProfileLevel.HEVCProfileMain10
    DynamicRangeProfiles.HDR10 -> MediaCodecInfo.CodecProfileLevel.HEVCProfileMain10HDR10
    DynamicRangeProfiles.HDR10_PLUS -> MediaCodecInfo.CodecProfileLevel.HEVCProfileMain10HDR10Plus
    else -> null
  }

  if (profile != null) {
    Log.i("MediaFormat", "Using HDR Profile $profile")
    this.setInteger(MediaFormat.KEY_PROFILE, profile)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      this.setInteger(MediaFormat.KEY_COLOR_STANDARD, MediaFormat.COLOR_STANDARD_BT2020)
      this.setInteger(MediaFormat.KEY_COLOR_RANGE, MediaFormat.COLOR_RANGE_FULL)
      this.setInteger(MediaFormat.KEY_COLOR_TRANSFER, getTransferFunction(profile))
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      this.setFeatureEnabled(MediaCodecInfo.CodecCapabilities.FEATURE_HdrEditing, true)
    }
  }
}

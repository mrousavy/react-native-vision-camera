package com.mrousavy.camera.parsers

import android.hardware.camera2.CaptureRequest
import com.mrousavy.camera.InvalidTypeScriptUnionError

enum class Flash(override val unionValue: String): JSUnionValue {
  OFF("off"),
  ON("on"),
  AUTO("auto");

  fun toControlAeMode(enableRedEyeReduction: Boolean? = false): Int {
    return when (this) {
      OFF -> CaptureRequest.CONTROL_AE_MODE_ON
      ON -> CaptureRequest.CONTROL_AE_MODE_ON_ALWAYS_FLASH
      AUTO -> if (enableRedEyeReduction == true) CaptureRequest.CONTROL_AE_MODE_ON_AUTO_FLASH_REDEYE else CaptureRequest.CONTROL_AE_MODE_ON_AUTO_FLASH
    }
  }

  companion object: JSUnionValue.Companion<Flash> {
    override fun fromUnionValue(unionValue: String?): Flash {
      return when (unionValue) {
        "off" -> OFF
        "on" -> ON
        "auto" -> AUTO
        else -> throw InvalidTypeScriptUnionError("flash", unionValue ?: "(null)")
      }
    }
  }
}

package com.mrousavy.camera.core.types

import androidx.camera.core.ImageCapture
import com.mrousavy.camera.core.InvalidTypeScriptUnionError

enum class Flash(override val unionValue: String) : JSUnionValue {
  OFF("off"),
  ON("on"),
  AUTO("auto");

  fun toFlashMode(): Int =
    when (this) {
      OFF -> ImageCapture.FLASH_MODE_OFF
      ON -> ImageCapture.FLASH_MODE_ON
      AUTO -> ImageCapture.FLASH_MODE_AUTO
    }

  companion object : JSUnionValue.Companion<Flash> {
    override fun fromUnionValue(unionValue: String?): Flash =
      when (unionValue) {
        "off" -> OFF
        "on" -> ON
        "auto" -> AUTO
        else -> throw InvalidTypeScriptUnionError("flash", unionValue ?: "(null)")
      }
  }
}

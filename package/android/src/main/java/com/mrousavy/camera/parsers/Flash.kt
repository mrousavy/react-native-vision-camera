package com.mrousavy.camera.parsers

import com.mrousavy.camera.InvalidTypeScriptUnionError

enum class Flash(override val unionValue: String) : JSUnionValue {
  OFF("off"),
  ON("on"),
  AUTO("auto");

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

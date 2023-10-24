package com.mrousavy.camera.types

enum class DeviceType(override val unionValue: String) : JSUnionValue {
  ULTRA_WIDE_ANGLE("ultra-wide-angle-camera"),
  WIDE_ANGLE("wide-angle-camera"),
  TELEPHOTO("telephoto-camera")
}

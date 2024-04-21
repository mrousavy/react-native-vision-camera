package com.mrousavy.camera.core.types

enum class ShutterType(override val unionValue: String) : JSUnionValue {
  PHOTO("photo"),
  SNAPSHOT("snapshot")
}

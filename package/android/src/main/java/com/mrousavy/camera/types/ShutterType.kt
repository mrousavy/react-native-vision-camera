package com.mrousavy.camera.types

enum class ShutterType(override val unionValue: String) : JSUnionValue {
  PHOTO("photo"),
  SNAPSHOT("snapshot")
}

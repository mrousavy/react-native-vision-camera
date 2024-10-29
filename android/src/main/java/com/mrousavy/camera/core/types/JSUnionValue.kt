package com.mrousavy.camera.core.types

interface JSUnionValue {
  val unionValue: String

  interface Companion<T> {
    fun fromUnionValue(unionValue: String?): T?
  }
}

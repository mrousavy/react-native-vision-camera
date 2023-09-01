package com.mrousavy.camera.parsers

interface JSUnionValue {
  val unionValue: String

  interface Companion<T> {
    fun fromUnionValue(unionValue: String?): T?
  }
}

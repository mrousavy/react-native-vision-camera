package com.mrousavy.camera.extensions

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.mrousavy.camera.types.JSUnionValue

fun List<JSUnionValue>.toJSValue(): ReadableArray {
  val arguments = Arguments.createArray()
  this.forEach { arguments.pushString(it.unionValue) }
  return arguments
}

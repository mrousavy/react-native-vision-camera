package com.mrousavy.camera.react.extensions

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.mrousavy.camera.core.types.JSUnionValue

fun List<JSUnionValue>.toJSValue(): ReadableArray {
  val arguments = Arguments.createArray()
  this.forEach { arguments.pushString(it.unionValue) }
  return arguments
}

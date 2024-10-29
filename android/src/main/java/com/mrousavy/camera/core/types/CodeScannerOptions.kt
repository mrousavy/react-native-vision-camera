package com.mrousavy.camera.core.types

import com.facebook.react.bridge.ReadableMap
import com.mrousavy.camera.core.InvalidTypeScriptUnionError

data class CodeScannerOptions(val codeTypes: List<CodeType>) {
  companion object {
    fun fromJSValue(value: ReadableMap): CodeScannerOptions {
      val jsCodeTypes = value.getArray("codeTypes") ?: throw InvalidTypeScriptUnionError("codeScanner", value.toString())
      val codeTypes = jsCodeTypes.toArrayList().map { CodeType.fromUnionValue(it as String) }
      return CodeScannerOptions(codeTypes)
    }
  }
}

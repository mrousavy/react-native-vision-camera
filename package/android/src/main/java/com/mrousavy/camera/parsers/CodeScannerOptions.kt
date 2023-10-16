package com.mrousavy.camera.parsers

import com.facebook.react.bridge.ReadableMap
import com.mrousavy.camera.core.InvalidTypeScriptUnionError

class CodeScannerOptions(map: ReadableMap) {
  val codeTypes: List<CodeType>

  init {
    val codeTypes = map.getArray("codeTypes")?.toArrayList() ?: throw InvalidTypeScriptUnionError("codeScanner", map.toString())
    this.codeTypes = codeTypes.map {
      return@map CodeType.fromUnionValue(it as String)
    }
  }

  override fun equals(other: Any?): Boolean {
    if (other !is CodeScannerOptions) return false
    return codeTypes.size == other.codeTypes.size && codeTypes.containsAll(other.codeTypes)
  }

  override fun hashCode(): Int = codeTypes.hashCode()
}

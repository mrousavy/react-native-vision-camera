package com.mrousavy.camera.hooks


abstract class DataProvider<T>(private val onChange: (value: T?) -> Unit) {
  private var value: T? = null
  fun update(value: T?) {
    if (this.value != value) {
      this.value = value
      onChange(value)
    }
  }

  val currentValue: T?
    get() = value
}

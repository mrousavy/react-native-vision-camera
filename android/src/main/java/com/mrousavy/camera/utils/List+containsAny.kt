package com.mrousavy.camera.utils

fun <T> List<T>.containsAny(elements: List<T>): Boolean {
  return elements.any { element -> this.contains(element) }
}

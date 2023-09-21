package com.mrousavy.camera.extensions

fun <T> List<T>.containsAny(elements: List<T>): Boolean = elements.any { element -> this.contains(element) }

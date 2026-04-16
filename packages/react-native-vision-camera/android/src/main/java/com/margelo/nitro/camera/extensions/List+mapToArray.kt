package com.margelo.nitro.camera.extensions

inline fun <T, reified R> List<T>.mapToArray(mapper: (T) -> R): Array<R> {
  return Array(size, { i -> mapper(this[i]) })
}

inline fun <T, reified R> Set<T>.mapToArray(mapper: (T) -> R): Array<R> {
  return Array(size, { i -> mapper(this.elementAt(i)) })
}

inline fun <T, reified R> Array<T>.mapToArray(mapper: (T) -> R): Array<R> {
  return Array(size, { i -> mapper(this.elementAt(i)) })
}

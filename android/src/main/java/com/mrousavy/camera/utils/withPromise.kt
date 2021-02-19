package com.mrousavy.camera.utils

import com.cuvent.experiences.friends.camera.CameraError
import com.cuvent.experiences.friends.camera.UnknownCameraError
import com.facebook.react.bridge.Promise

inline fun withPromise(promise: Promise, closure: () -> Any?) {
    try {
        val result = closure()
        promise.resolve(result)
    } catch (e: Throwable) {
        e.printStackTrace()
        val error = if (e is CameraError) e else UnknownCameraError(e)
        promise.reject("${error.domain}/${error.id}", error.message, error.cause)
    }
}

inline fun withSuspendablePromise(promise: Promise, closure: () -> Any?) {
    try {
        val result = closure()
        promise.resolve(result)
    } catch (e: Throwable) {
        e.printStackTrace()
        val error = if (e is CameraError) e else UnknownCameraError(e)
        promise.reject("${error.domain}/${error.id}", error.message, error.cause)
    }
}

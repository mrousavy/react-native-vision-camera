package com.mrousavy.camera.extensions

import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.ImageProxy
import kotlinx.coroutines.suspendCancellableCoroutine
import java.util.concurrent.Executor
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

suspend inline fun ImageCapture.takePicture(executor: Executor): ImageProxy {
  return suspendCancellableCoroutine { continuation ->
    takePicture(executor, object: ImageCapture.OnImageCapturedCallback() {
      override fun onCaptureSuccess(image: ImageProxy) {
        super.onCaptureSuccess(image)
        if (continuation.isActive) {
          continuation.resume(image)
        }
      }

      override fun onError(exception: ImageCaptureException) {
        super.onError(exception)
        if (continuation.isActive) {
          continuation.resumeWithException(exception)
        }
      }
    })
  }
}

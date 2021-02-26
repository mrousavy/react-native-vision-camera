package com.mrousavy.camera.utils

import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.ImageProxy
import java.util.concurrent.Executor
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

suspend inline fun ImageCapture.takePicture(options: ImageCapture.OutputFileOptions, executor: Executor) = suspendCoroutine<ImageCapture.OutputFileResults> { cont ->
  this.takePicture(
    options, executor,
    object : ImageCapture.OnImageSavedCallback {
      override fun onImageSaved(outputFileResults: ImageCapture.OutputFileResults) {
        cont.resume(outputFileResults)
      }

      override fun onError(exception: ImageCaptureException) {
        cont.resumeWithException(exception)
      }
    }
  )
}

suspend inline fun ImageCapture.takePicture(executor: Executor) = suspendCoroutine<ImageProxy> { cont ->
  this.takePicture(
    executor,
    object : ImageCapture.OnImageCapturedCallback() {
      override fun onCaptureSuccess(image: ImageProxy) {
        super.onCaptureSuccess(image)
        cont.resume(image)
      }

      override fun onError(exception: ImageCaptureException) {
        super.onError(exception)
        cont.resumeWithException(exception)
      }
    }
  )
}

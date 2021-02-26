package com.mrousavy.camera.utils

import android.content.Context
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

suspend fun getCameraProvider(context: Context) = suspendCoroutine<ProcessCameraProvider> { cont ->
  val cameraProviderFuture = ProcessCameraProvider.getInstance(context)

  cameraProviderFuture.addListener(
    {
      cont.resume(cameraProviderFuture.get())
    },
    ContextCompat.getMainExecutor(context)
  )
}

package com.mrousavy.camera.core.extensions

import android.content.Context
import android.util.Log
import androidx.camera.core.CameraSelector
import androidx.camera.extensions.ExtensionsManager
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat

private const val TAG = "CameraSelector"

suspend fun CameraSelector.withExtension(
  context: Context,
  provider: ProcessCameraProvider,
  needsImageAnalysis: Boolean,
  extension: Int,
  extensionDebugName: String
): CameraSelector {
  Log.i(TAG, "$extensionDebugName is enabled, looking up vendor $extensionDebugName extension...")

  val mainExecutor = ContextCompat.getMainExecutor(context)
  val extensionsManager = ExtensionsManager.getInstanceAsync(context, provider).await(mainExecutor)

  if (extensionsManager.isExtensionAvailable(this, extension)) {
    if (needsImageAnalysis && !extensionsManager.isImageAnalysisSupported(this, extension)) {
      Log.i(
        TAG,
        "Device supports a $extensionDebugName vendor extension, but we cannot use it since we need ImageAnalysis " +
          "and this extension does not work with ImageAnalysis use-cases."
      )
      return this
    }

    Log.i(TAG, "Device supports a $extensionDebugName vendor extension! Enabling...")
    return extensionsManager.getExtensionEnabledCameraSelector(this, extension)
  }
  return this
}

package com.mrousavy.camera.extensions

import android.content.Context
import android.util.Log
import androidx.camera.core.CameraSelector
import androidx.camera.extensions.ExtensionsManager
import androidx.camera.lifecycle.ProcessCameraProvider

private const val TAG = "CameraSelector"

suspend fun CameraSelector.withExtension(
  context: Context,
  provider: ProcessCameraProvider,
  extension: Int,
  extensionDebugName: String
): CameraSelector {
  Log.i(TAG, "$extensionDebugName is enabled, looking up vendor $extensionDebugName extension...")
  val extensionsManager = ExtensionsManager.getInstanceAsync(context, provider).await()
  if (extensionsManager.isExtensionAvailable(this, extension)) {
    Log.i(TAG, "Device supports a $extensionDebugName vendor extension! Enabling...")
    return extensionsManager.getExtensionEnabledCameraSelector(this, extension)
  }
  return this
}

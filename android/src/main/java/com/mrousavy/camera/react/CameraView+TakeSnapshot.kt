package com.mrousavy.camera.react

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.mrousavy.camera.core.SnapshotFailedError
import com.mrousavy.camera.core.SnapshotFailedPreviewNotEnabledError
import com.mrousavy.camera.core.types.ShutterType
import com.mrousavy.camera.core.types.TakeSnapshotOptions
import com.mrousavy.camera.core.utils.FileUtils

private const val TAG = "CameraView.takeSnapshot"

fun CameraView.takeSnapshot(options: TakeSnapshotOptions): WritableMap {
  Log.i(TAG, "Capturing snapshot of Camera View...")
  val previewView = previewView ?: throw SnapshotFailedPreviewNotEnabledError()
  val bitmap = previewView.bitmap ?: throw SnapshotFailedError()

  // Shutter Event (JS)
  onShutter(ShutterType.SNAPSHOT)

  // Write snapshot to .jpg file
  FileUtils.writeBitmapTofile(bitmap, options.file.file, options.quality)

  Log.i(TAG, "Successfully saved snapshot to file!")

  val orientation = cameraSession.outputOrientation

  // Parse output data
  val map = Arguments.createMap()
  map.putString("path", options.file.file.absolutePath)
  map.putInt("width", bitmap.width)
  map.putInt("height", bitmap.height)
  map.putString("orientation", orientation.unionValue)
  map.putBoolean("isMirrored", false)
  return map
}

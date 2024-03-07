package com.mrousavy.camera

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.mrousavy.camera.core.SnapshotFailedError
import com.mrousavy.camera.types.ShutterType
import com.mrousavy.camera.types.SnapshotOptions
import com.mrousavy.camera.utils.FileUtils

private const val TAG = "CameraView.takeSnapshot"

fun CameraView.takeSnapshot(options: SnapshotOptions): WritableMap {
  Log.i(TAG, "Capturing snapshot of Camera View...")
  val bitmap = previewView.bitmap ?: throw SnapshotFailedError()

  onShutter(ShutterType.SNAPSHOT)

  val file = FileUtils.createTempFile(context, "jpg")
  FileUtils.writeBitmapTofile(bitmap, file, options.quality)

  Log.i(TAG, "Successfully saved snapshot to file!")

  val map = Arguments.createMap()
  map.putString("path", file.absolutePath)
  map.putInt("width", bitmap.width)
  map.putInt("height", bitmap.height)
  map.putString("orientation", orientation.unionValue)
  map.putBoolean("isMirrored", false)
  return map
}

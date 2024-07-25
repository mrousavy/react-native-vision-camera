package com.mrousavy.camera.react

import android.annotation.SuppressLint
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.mrousavy.camera.core.takePhoto
import com.mrousavy.camera.core.types.TakePhotoOptions

private const val TAG = "CameraView.takePhoto"

@SuppressLint("UnsafeOptInUsageError")
suspend fun CameraView.takePhoto(optionsMap: ReadableMap): WritableMap {
  Log.i(TAG, "Taking photo... Options: ${optionsMap.toHashMap()}")

  // Parse options and shoot photo
  val options = TakePhotoOptions.fromJS(context, optionsMap)
  val photo = cameraSession.takePhoto(options)

  Log.i(TAG, "Successfully captured ${photo.width} x ${photo.height} photo!")

  val map = Arguments.createMap()
  map.putString("path", photo.path)
  map.putInt("width", photo.width)
  map.putInt("height", photo.height)
  map.putString("orientation", photo.orientation.unionValue)
  map.putBoolean("isRawPhoto", false)
  map.putBoolean("isMirrored", photo.isMirrored)

  return map
}

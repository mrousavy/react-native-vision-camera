package com.mrousavy.camera

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.ImageFormat
import android.hardware.camera2.*
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.mrousavy.camera.core.InsufficientStorageError
import com.mrousavy.camera.core.Photo
import com.mrousavy.camera.types.Flash
import com.mrousavy.camera.utils.*
import java.io.IOException
import kotlinx.coroutines.*

private const val TAG = "CameraView.takePhoto"

@SuppressLint("UnsafeOptInUsageError")
suspend fun CameraView.takePhoto(optionsMap: ReadableMap): WritableMap {
  val options = optionsMap.toHashMap()
  Log.i(TAG, "Taking photo... Options: $options")

  val flash = options["flash"] as? String ?: "off"
  val enableShutterSound = options["enableShutterSound"] as? Boolean ?: true

  val photo = cameraSession.takePhoto(
    Flash.fromUnionValue(flash),
    enableShutterSound,
    orientation
  )

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

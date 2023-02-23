package com.mrousavy.camera

import android.annotation.SuppressLint
import android.hardware.camera2.*
import android.util.Log
import androidx.camera.camera2.interop.Camera2CameraInfo
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageProxy
import androidx.exifinterface.media.ExifInterface
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.mrousavy.camera.utils.*
import kotlinx.coroutines.*
import java.io.File
import kotlin.system.measureTimeMillis

@SuppressLint("UnsafeOptInUsageError")
suspend fun CameraView.takePhoto(options: ReadableMap): WritableMap = coroutineScope {
  throw NotImplementedError("TODO: takePhoto()")
}

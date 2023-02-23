package com.mrousavy.camera

import android.graphics.Bitmap
import androidx.exifinterface.media.ExifInterface
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.mrousavy.camera.utils.buildMetadataMap
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import kotlinx.coroutines.guava.await

suspend fun CameraView.takeSnapshot(options: ReadableMap): WritableMap = coroutineScope {
  throw NotImplementedError("TODO: takeSnapshot()")
}

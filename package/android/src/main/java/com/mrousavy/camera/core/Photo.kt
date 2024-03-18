package com.mrousavy.camera.core

import android.graphics.ImageFormat
import androidx.camera.core.ImageProxy
import com.mrousavy.camera.types.Orientation
import java.io.Closeable

data class Photo(val path: String, val width: Int, val height: Int, val orientation: Orientation, val isMirrored: Boolean)

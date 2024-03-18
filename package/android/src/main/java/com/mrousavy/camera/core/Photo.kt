package com.mrousavy.camera.core

import com.mrousavy.camera.types.Orientation

data class Photo(val path: String, val width: Int, val height: Int, val orientation: Orientation, val isMirrored: Boolean)

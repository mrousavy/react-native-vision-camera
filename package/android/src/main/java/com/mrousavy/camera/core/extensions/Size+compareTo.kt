package com.mrousavy.camera.core.extensions

import android.util.Size

operator fun Size.compareTo(other: Size): Int = (this.width * this.height).compareTo(other.width * other.height)

package com.mrousavy.camera.extensions

import android.content.res.Resources

val Float.px: Float
    get() = this * Resources.getSystem().displayMetrics.density

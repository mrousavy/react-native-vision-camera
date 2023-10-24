package com.mrousavy.camera.core.outputs

import android.hardware.camera2.params.OutputConfiguration
import android.util.Size
import android.view.Surface
import android.view.SurfaceHolder

class PreviewOutput(val size: Size, enableHdr: Boolean) {
  val outputConfiguration = OutputConfiguration(size, SurfaceHolder::class.java)
  var surface: Surface? = null
    get() = outputConfiguration.surface
    set(value) {
      outputConfiguration.surfaces.forEach { outputConfiguration.removeSurface(it) }
      if (value != null) {
        outputConfiguration.addSurface(value)
      }
      field = value
    }
}

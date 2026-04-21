package com.margelo.nitro.camera.hybrids.orientation

import android.content.Context
import android.hardware.display.DisplayManager
import android.util.Log
import com.margelo.nitro.NitroModules
import com.margelo.nitro.camera.CameraOrientation
import com.margelo.nitro.camera.HybridOrientationManagerSpec
import com.margelo.nitro.camera.OrientationSource
import com.margelo.nitro.camera.extensions.fromSurfaceRotation

class HybridInterfaceOrientationManager : HybridOrientationManagerSpec() {
  override val source: OrientationSource = OrientationSource.INTERFACE
  override var currentOrientation: CameraOrientation?
    private set
  private val context: Context
    get() = NitroModules.applicationContext ?: throw Error("No Context available!")
  private val displayManager = context.getSystemService(Context.DISPLAY_SERVICE) as DisplayManager
  private var listener: DisplayManager.DisplayListener? = null

  init {
    val defaultDisplay = displayManager.displays.firstOrNull()
    if (defaultDisplay != null) {
      val surfaceRotation = defaultDisplay.rotation
      currentOrientation = CameraOrientation.fromSurfaceRotation(surfaceRotation)
    } else {
      currentOrientation = null
    }
  }

  override fun startOrientationUpdates(onChanged: (orientation: CameraOrientation) -> Unit) {
    listener?.let { listener ->
      displayManager.unregisterDisplayListener(listener)
    }
    val listener =
      object : DisplayManager.DisplayListener {
        override fun onDisplayAdded(displayId: Int) = Unit

        override fun onDisplayRemoved(displayId: Int) = Unit

        override fun onDisplayChanged(displayId: Int) {
          val display = displayManager.getDisplay(displayId) ?: return
          val surfaceRotation = display.rotation
          val orientation = CameraOrientation.fromSurfaceRotation(surfaceRotation)
          if (currentOrientation != orientation) {
            Log.i(TAG, "Display orientation changed! $orientation")
            currentOrientation = orientation
            onChanged(orientation)
          }
        }
      }
    displayManager.registerDisplayListener(listener, null)
  }

  override fun stopOrientationUpdates() {
    listener?.let { listener ->
      displayManager.unregisterDisplayListener(listener)
    }
  }
}

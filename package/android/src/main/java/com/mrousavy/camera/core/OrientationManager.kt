package com.mrousavy.camera.core

import android.content.Context
import android.hardware.display.DisplayManager
import android.util.Log
import android.view.OrientationEventListener
import android.view.Surface
import com.mrousavy.camera.core.types.Orientation
import com.mrousavy.camera.core.types.OutputOrientation

class OrientationManager(private val context: Context, private val callback: Callback) {
  companion object {
    private const val TAG = "OrientationManager"
  }

  private var targetOutputOrientation = OutputOrientation.DEVICE
  private var lastOutputOrientation: Orientation? = null
  private var lastPreviewOrientation: Orientation? = null

  // Screen Orientation Listener
  private var screenRotation = Surface.ROTATION_0
  private val displayManager = context.getSystemService(Context.DISPLAY_SERVICE) as DisplayManager
  private val displayListener = object : DisplayManager.DisplayListener {
    override fun onDisplayAdded(displayId: Int) = Unit
    override fun onDisplayRemoved(displayId: Int) = Unit
    override fun onDisplayChanged(displayId: Int) {
      // Display rotated!
      val display = displayManager.getDisplay(displayId) ?: return
      screenRotation = display.rotation
      maybeNotifyOrientationChanged()
    }
  }

  // Physical Device Orientation listener
  private var deviceRotation = Surface.ROTATION_0
  private val orientationListener = object : OrientationEventListener(context) {
    override fun onOrientationChanged(rotationDegrees: Int) {
      // Phone rotated!
      deviceRotation = degreesToSurfaceRotation(rotationDegrees)
      maybeNotifyOrientationChanged()
    }
  }

  // Get the current preview orientation (computed by the screen's orientation)
  val previewOrientation: Orientation
    get() = Orientation.fromSurfaceRotation(screenRotation)

  // Get the current output orientation (a computed value)
  val outputOrientation: Orientation
    get() {
      return when (targetOutputOrientation) {
        OutputOrientation.DEVICE -> Orientation.fromSurfaceRotation(deviceRotation)
        OutputOrientation.PREVIEW -> previewOrientation
      }
    }

  private fun maybeNotifyOrientationChanged() {
    val newPreviewOrientation = previewOrientation
    if (lastPreviewOrientation != newPreviewOrientation) {
      callback.onPreviewOrientationChanged(newPreviewOrientation)
      lastPreviewOrientation = newPreviewOrientation
    }
    val newOutputOrientation = outputOrientation
    if (lastOutputOrientation != newOutputOrientation) {
      callback.onOutputOrientationChanged(newOutputOrientation)
      lastOutputOrientation = newOutputOrientation
    }
  }

  fun stopOrientationUpdates() {
    displayManager.unregisterDisplayListener(displayListener)
    orientationListener.disable()
  }

  fun setTargetOutputOrientation(targetOrientation: OutputOrientation) {
    Log.i(TAG, "Target Orientation changed $targetOutputOrientation -> $targetOrientation!")
    targetOutputOrientation = targetOrientation

    // remove previous listeners if we have any
    stopOrientationUpdates()

    when (targetOrientation) {
      OutputOrientation.DEVICE -> {
        Log.i(TAG, "Starting streaming device and screen orientation updates...")
        orientationListener.enable()
        displayManager.registerDisplayListener(displayListener, null)
      }

      OutputOrientation.PREVIEW -> {
        Log.i(TAG, "Starting streaming device and screen orientation updates...")
        displayManager.registerDisplayListener(displayListener, null)
      }
    }
  }

  private fun degreesToSurfaceRotation(degrees: Int): Int =
    when (degrees) {
      in 45..135 -> Surface.ROTATION_270
      in 135..225 -> Surface.ROTATION_180
      in 225..315 -> Surface.ROTATION_90
      else -> Surface.ROTATION_0
    }

  interface Callback {
    fun onOutputOrientationChanged(outputOrientation: Orientation)
    fun onPreviewOrientationChanged(previewOrientation: Orientation)
  }
}

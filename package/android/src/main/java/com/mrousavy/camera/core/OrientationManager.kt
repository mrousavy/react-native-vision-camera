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
  private var lastOrientation: Orientation? = null

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
      maybeNotifyOrientation()
    }
  }

  // Physical Device Orientation listener
  private var deviceRotation = Surface.ROTATION_0
  private val orientationListener = object : OrientationEventListener(context) {
    override fun onOrientationChanged(rotationDegrees: Int) {
      // Phone rotated!
      deviceRotation = degreesToSurfaceRotation(rotationDegrees)
      maybeNotifyOrientation()
    }
  }

  // Get the current output orientation (a computed value)
  val outputOrientation: Orientation
    get() {
      return when (targetOutputOrientation) {
        OutputOrientation.DEVICE -> Orientation.fromSurfaceRotation(deviceRotation)
        OutputOrientation.PREVIEW -> Orientation.fromSurfaceRotation(screenRotation)
        OutputOrientation.PORTRAIT -> Orientation.PORTRAIT
        OutputOrientation.LANDSCAPE_LEFT -> Orientation.LANDSCAPE_LEFT
        OutputOrientation.PORTRAIT_UPSIDE_DOWN -> Orientation.PORTRAIT_UPSIDE_DOWN
        OutputOrientation.LANDSCAPE_RIGHT -> Orientation.LANDSCAPE_RIGHT
      }
    }

  private fun maybeNotifyOrientation() {
    val newOrientation = outputOrientation
    if (lastOrientation != newOrientation) {
      callback.onOutputOrientationChanged(newOrientation)
      lastOrientation = newOrientation
    }
  }

  fun setTargetOutputOrientation(targetOrientation: OutputOrientation) {
    Log.i(TAG, "Target Orientation changed $targetOutputOrientation -> $targetOrientation!")
    targetOutputOrientation = targetOrientation
    lastOrientation = null

    // remove previous listeners if attached
    displayManager.unregisterDisplayListener(displayListener)
    orientationListener.disable()

    when (targetOrientation) {
      OutputOrientation.DEVICE -> {
        Log.i(TAG, "Starting streaming device orientation updates...")
        orientationListener.enable()
      }

      OutputOrientation.PREVIEW -> {
        Log.i(TAG, "Starting streaming screen rotation updates...")
        displayManager.registerDisplayListener(displayListener, null)
      }

      OutputOrientation.PORTRAIT,
      OutputOrientation.LANDSCAPE_RIGHT,
      OutputOrientation.PORTRAIT_UPSIDE_DOWN,
      OutputOrientation.LANDSCAPE_LEFT -> {
        Log.i(TAG, "Setting output orientation to $targetOrientation. (locked)")
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
  }
}

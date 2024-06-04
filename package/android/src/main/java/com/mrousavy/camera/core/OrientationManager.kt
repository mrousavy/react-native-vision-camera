package com.mrousavy.camera.core

import android.content.Context
import android.hardware.display.DisplayManager
import android.util.Log
import android.view.OrientationEventListener
import com.mrousavy.camera.core.types.Orientation
import com.mrousavy.camera.core.types.OutputOrientation

class OrientationManager(private val context: Context, private val callback: Callback) {
  companion object {
    private const val TAG = "OrientationManager"
  }

  private var targetOutputOrientation = OutputOrientation.DEVICE

  // Screen Orientation Listener
  private val displayManager = context.getSystemService(Context.DISPLAY_SERVICE) as DisplayManager
  private val displayListener = object : DisplayManager.DisplayListener {
    override fun onDisplayAdded(displayId: Int) = Unit
    override fun onDisplayRemoved(displayId: Int) = Unit
    override fun onDisplayChanged(displayId: Int) {
      // Display rotated!
      val display = displayManager.getDisplay(displayId) ?: return
      val surfaceRotation = display.rotation
      val orientation = Orientation.fromRotationDegrees(surfaceRotation)
      Log.i(TAG, "Output orientation changed! $orientation (screen)")
      callback.onOutputOrientationChanged(orientation)
    }
  }

  // Physical Device Orientation listener
  private val orientationListener = object: OrientationEventListener(context) {
    override fun onOrientationChanged(rotationDegrees: Int) {
      // Phone rotated!
      val orientation = Orientation.fromRotationDegrees(rotationDegrees)
      Log.i(TAG, "Output orientation changed! $orientation (device)")
      callback.onOutputOrientationChanged(orientation)
    }
  }

  fun setTargetOutputOrientation(targetOrientation: OutputOrientation) {
    if (targetOutputOrientation == targetOrientation) {
      // already the same
      return
    }

    targetOutputOrientation = targetOrientation

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
      OutputOrientation.PORTRAIT, OutputOrientation.LANDSCAPE_RIGHT, OutputOrientation.PORTRAIT_UPSIDE_DOWN, OutputOrientation.LANDSCAPE_LEFT -> {
        Log.i(TAG, "Setting output orientation to $targetOrientation. (locked)")
      }
    }
  }

  interface Callback {
    fun onOutputOrientationChanged(outputOrientation: Orientation)
  }
}

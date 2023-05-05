package com.mrousavy.camera.preview

import android.content.Context
import android.view.Surface
import android.widget.FrameLayout
import com.mrousavy.camera.frameprocessor.Frame

abstract class PreviewView(context: Context): FrameLayout(context) {
  /**
   * Draws a new Frame from the Camera into the Preview View.
   */
  abstract fun drawFrame(frame: Frame)

  // TODO: Should this return a "unsubscribe listener" func?
  abstract fun addOnSurfaceChangedListener(callback: (surface: Surface?) -> Unit)
}

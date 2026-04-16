package com.margelo.nitro.camera.public

import android.view.MotionEvent
import android.view.View

public interface NativeGestureController {
  /**
   * Handle the given [MotionEvent].
   * Returns `true` if touches should continue to be received.
   */
  fun onTouchEvent(
    view: View,
    event: MotionEvent,
  ): Boolean
}

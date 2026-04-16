package com.margelo.nitro.camera.public

import android.view.Surface

public interface NativeFrameRenderer {
  fun connectSurface(surface: Surface)

  fun disconnectSurface()
}

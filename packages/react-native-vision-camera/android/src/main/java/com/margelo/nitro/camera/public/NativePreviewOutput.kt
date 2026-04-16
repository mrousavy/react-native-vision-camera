package com.margelo.nitro.camera.public

import androidx.camera.core.Preview

public interface NativePreviewOutput {
  fun setSurfaceProvider(surfaceProvider: Preview.SurfaceProvider)

  fun removeSurfaceProvider(surfaceProvider: Preview.SurfaceProvider)
}

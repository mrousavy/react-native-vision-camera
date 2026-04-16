package com.margelo.nitro.camera.hybrids.outputs

import android.util.Log
import androidx.annotation.OptIn
import androidx.camera.core.ExperimentalMirrorMode
import androidx.camera.core.Preview
import com.margelo.nitro.camera.HybridCameraPreviewOutputSpec
import com.margelo.nitro.camera.MediaType
import com.margelo.nitro.camera.MirrorMode
import com.margelo.nitro.camera.Orientation
import com.margelo.nitro.camera.TargetStabilizationMode
import com.margelo.nitro.camera.extensions.converters.toMirrorMode
import com.margelo.nitro.camera.public.NativeCameraOutput
import com.margelo.nitro.camera.public.NativePreviewOutput

class HybridPreviewOutput :
  HybridCameraPreviewOutputSpec(),
  NativeCameraOutput,
  NativePreviewOutput {
  override val mediaType: MediaType = MediaType.VIDEO
  override var outputOrientation: Orientation
    get() = Orientation.UP
    set(_) {
      // Setting orientation in a Preview output does nothing.
      // It is controlled by the PreviewView.
    }
  override val mirrorMode: MirrorMode = MirrorMode.AUTO

  private var preview: Preview? = null
  private var surfaceProvider: Preview.SurfaceProvider? = null

  override fun setSurfaceProvider(surfaceProvider: Preview.SurfaceProvider) {
    this.surfaceProvider = surfaceProvider
    preview?.surfaceProvider = surfaceProvider
  }

  override fun removeSurfaceProvider(surfaceProvider: Preview.SurfaceProvider) {
    if (this.surfaceProvider == surfaceProvider) {
      this.surfaceProvider = null
      preview?.surfaceProvider = null
    }
  }

  @OptIn(ExperimentalMirrorMode::class)
  override fun createUseCase(
    mirrorMode: MirrorMode,
    config: NativeCameraOutput.Config,
  ): NativeCameraOutput.PreparedUseCase {
    val preview =
      Preview
        .Builder()
        .apply {
          // isMirrored={...}
          setMirrorMode(mirrorMode.toMirrorMode())

          // stabilizationMode={...}
          when (config.previewStabilizationMode) {
            TargetStabilizationMode.OFF -> {
              // Stabilization is explicitly disabled.
              setPreviewStabilizationEnabled(false)
            }
            null, TargetStabilizationMode.AUTO -> {
              // Unspecified - might be enabled, might be disabled.
            }
            else -> {
              // Stabilization is explicitly enabled, no matter if it's `STANDARD`, `CINEMATIC`, etc - Android only knows "ON".
              setPreviewStabilizationEnabled(true)
            }
          }
        }.build()

    return NativeCameraOutput.PreparedUseCase(preview) {
      this.preview = preview
      this.preview?.surfaceProvider = surfaceProvider
    }
  }
}

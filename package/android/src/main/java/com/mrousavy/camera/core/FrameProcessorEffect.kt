package com.mrousavy.camera.core

import android.annotation.SuppressLint
import androidx.camera.core.CameraEffect
import com.mrousavy.camera.types.PixelFormat

@SuppressLint("RestrictedApi")
class FrameProcessorEffect(
  format: PixelFormat = PixelFormat.NATIVE,
  enableGpuBuffers: Boolean = false,
  callback: CameraSession.Callback,
  targets: Int = PREVIEW,
  processor: FrameProcessorSurfaceProcessor = FrameProcessorSurfaceProcessor(format, enableGpuBuffers, callback)
) : CameraEffect(
  targets,
  CameraQueues.videoQueue.executor,
  processor,
  { error -> callback.onError(error) }
)

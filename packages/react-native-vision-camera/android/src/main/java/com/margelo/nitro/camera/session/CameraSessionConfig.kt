package com.margelo.nitro.camera.session

import androidx.camera.core.SessionConfig
import com.margelo.nitro.camera.public.NativeCameraOutput

data class CameraSessionConfig(
  val sessionConfig: SessionConfig,
  val preparedUseCases: List<NativeCameraOutput.PreparedUseCase>,
  val resolvedConfig: NativeCameraOutput.Config,
)

package com.margelo.nitro.camera.session

import androidx.annotation.Keep
import androidx.camera.core.SessionConfig
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.camera.public.NativeCameraOutput

@Keep
@DoNotStrip
data class CameraSessionConfig(
  val sessionConfig: SessionConfig,
  val preparedUseCases: List<NativeCameraOutput.PreparedUseCase>,
  val resolvedConfig: NativeCameraOutput.Config,
)

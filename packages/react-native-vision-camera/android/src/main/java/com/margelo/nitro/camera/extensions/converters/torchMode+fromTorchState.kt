package com.margelo.nitro.camera.extensions.converters

import androidx.camera.core.TorchState
import com.margelo.nitro.camera.TorchMode

fun TorchMode.Companion.fromTorchState(
  @TorchState.State torchState: Int,
): TorchMode {
  return when (torchState) {
    TorchState.ON -> TorchMode.ON
    TorchState.OFF -> TorchMode.OFF
    else -> TorchMode.OFF
  }
}

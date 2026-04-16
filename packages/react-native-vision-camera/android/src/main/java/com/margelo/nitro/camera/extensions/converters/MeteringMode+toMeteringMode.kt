package com.margelo.nitro.camera.extensions.converters

import androidx.camera.core.FocusMeteringAction
import com.margelo.nitro.camera.MeteringMode

@FocusMeteringAction.MeteringMode
fun MeteringMode.toMeteringMode(): Int {
  return when (this) {
    MeteringMode.AE -> FocusMeteringAction.FLAG_AE
    MeteringMode.AF -> FocusMeteringAction.FLAG_AF
    MeteringMode.AWB -> FocusMeteringAction.FLAG_AWB
  }
}

@FocusMeteringAction.MeteringMode
@Throws
fun Array<MeteringMode>.toMeteringMode(): Int {
  if (this.isEmpty()) throw Error("MeteringModes cannot be empty!")
  return this.fold(0) { acc, mode -> acc or mode.toMeteringMode() }
}

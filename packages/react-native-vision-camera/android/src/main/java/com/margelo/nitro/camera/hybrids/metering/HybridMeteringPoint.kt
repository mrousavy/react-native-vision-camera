package com.margelo.nitro.camera.hybrids.metering

import android.annotation.SuppressLint
import androidx.camera.core.MeteringPoint
import com.margelo.nitro.camera.HybridMeteringPointSpec

class HybridMeteringPoint(
  override val relativeX: Double,
  override val relativeY: Double,
  override val relativeSize: Double?,
  val meteringPoint: MeteringPoint,
) : HybridMeteringPointSpec() {
  override val normalizedX: Double
    @SuppressLint("RestrictedApi")
    get() = meteringPoint.x.toDouble()
  override val normalizedY: Double
    @SuppressLint("RestrictedApi")
    get() = meteringPoint.y.toDouble()
  override val normalizedSize: Double
    get() = meteringPoint.size.toDouble()
}

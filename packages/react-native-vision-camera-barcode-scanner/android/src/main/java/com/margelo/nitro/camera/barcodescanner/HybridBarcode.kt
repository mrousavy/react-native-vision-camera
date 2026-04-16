package com.margelo.nitro.camera.barcodescanner

import com.google.mlkit.vision.barcode.common.Barcode
import com.margelo.nitro.camera.barcodescanner.extensions.fromMLBarcodeFormat
import com.margelo.nitro.camera.barcodescanner.extensions.fromMLBarcodeValueType
import com.margelo.nitro.core.ArrayBuffer

class HybridBarcode(
  private val barcode: Barcode,
) : HybridBarcodeSpec() {
  override val format: BarcodeFormat
    get() = BarcodeFormat.fromMLBarcodeFormat(barcode.format)
  override val boundingBox: Rect
    get() {
      val box = barcode.boundingBox ?: return Rect(0.0, 0.0, 0.0, 0.0)
      return Rect(box.left.toDouble(), box.right.toDouble(), box.top.toDouble(), box.bottom.toDouble())
    }
  override val cornerPoints: Array<Point>
    get() {
      val points = barcode.cornerPoints ?: return emptyArray()
      return points
        .map { point -> Point(point.x.toDouble(), point.y.toDouble()) }
        .toTypedArray()
    }
  override val displayValue: String?
    get() = barcode.displayValue
  override val rawBytes: ArrayBuffer? by lazy {
    val bytes = barcode.rawBytes ?: return@lazy null
    return@lazy ArrayBuffer.copy(bytes)
  }
  override val rawValue: String?
    get() = barcode.rawValue
  override val valueType: BarcodeValueType
    get() = BarcodeValueType.fromMLBarcodeValueType(barcode.valueType)
}

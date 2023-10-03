package com.mrousavy.camera.parsers

import com.google.mlkit.vision.barcode.common.Barcode
import com.mrousavy.camera.InvalidTypeScriptUnionError

enum class CodeType(override val unionValue: String) : JSUnionValue {
  QR("qr"),
  AZTEC("aztec"),
  EAN13("ean-13");

  fun toBarcodeType(): Int {
    return when (this) {
      QR -> Barcode.FORMAT_QR_CODE
      AZTEC -> Barcode.FORMAT_AZTEC
      EAN13 -> Barcode.FORMAT_EAN_13
      // TODO: Implement other QR types
      else -> throw NotImplementedError()
    }
  }

  companion object : JSUnionValue.Companion<CodeType> {
    fun fromBarcodeType(barcodeType: Int): CodeType =
      when (barcodeType) {
        Barcode.FORMAT_QR_CODE -> QR
        Barcode.FORMAT_AZTEC -> AZTEC
        Barcode.FORMAT_EAN_13 -> EAN13
        // TODO: Implement other QR types
        else -> throw NotImplementedError()
      }

    override fun fromUnionValue(unionValue: String?): CodeType =
      when (unionValue) {
        "qr" -> QR
        "aztec" -> AZTEC
        "ean-13" -> EAN13
        // TODO: Implement other QR types
        else -> throw InvalidTypeScriptUnionError("codeType", unionValue ?: "(null)")
      }
  }
}

package com.mrousavy.camera.parsers

import com.google.mlkit.vision.barcode.common.Barcode
import com.mrousavy.camera.core.CodeTypeNotSupportedError
import com.mrousavy.camera.core.InvalidTypeScriptUnionError

enum class CodeType(override val unionValue: String) : JSUnionValue {
  CODE_128("code-128"),
  CODE_39("code-39"),
  CODE_93("code-93"),
  CODABAR("codabar"),
  EAN_13("ean-13"),
  EAN_8("ean-8"),
  ITF("itf"),
  UPC_E("upc-e"),
  QR("qr"),
  PDF_417("pdf-417"),
  AZTEC("aztec"),
  DATA_MATRIX("data-matrix"),
  UNKNOWN("unknown");

  fun toBarcodeType(): Int =
    when (this) {
      CODE_128 -> Barcode.FORMAT_CODE_128
      CODE_39 -> Barcode.FORMAT_CODE_39
      CODE_93 -> Barcode.FORMAT_CODE_93
      CODABAR -> Barcode.FORMAT_CODABAR
      EAN_13 -> Barcode.FORMAT_EAN_13
      EAN_8 -> Barcode.FORMAT_EAN_8
      ITF -> Barcode.FORMAT_ITF
      UPC_E -> Barcode.FORMAT_UPC_E
      QR -> Barcode.FORMAT_QR_CODE
      PDF_417 -> Barcode.FORMAT_PDF417
      AZTEC -> Barcode.FORMAT_AZTEC
      DATA_MATRIX -> Barcode.FORMAT_DATA_MATRIX
      UNKNOWN -> throw CodeTypeNotSupportedError(this.unionValue)
    }

  companion object : JSUnionValue.Companion<CodeType> {
    fun fromBarcodeType(barcodeType: Int): CodeType =
      when (barcodeType) {
        Barcode.FORMAT_CODE_128 -> CODE_128
        Barcode.FORMAT_CODE_39 -> CODE_39
        Barcode.FORMAT_CODE_93 -> CODE_93
        Barcode.FORMAT_CODABAR -> CODABAR
        Barcode.FORMAT_EAN_13 -> EAN_13
        Barcode.FORMAT_EAN_8 -> EAN_8
        Barcode.FORMAT_ITF -> ITF
        Barcode.FORMAT_UPC_E -> UPC_E
        Barcode.FORMAT_QR_CODE -> QR
        Barcode.FORMAT_PDF417 -> PDF_417
        Barcode.FORMAT_AZTEC -> AZTEC
        Barcode.FORMAT_DATA_MATRIX -> DATA_MATRIX
        else -> UNKNOWN
      }

    override fun fromUnionValue(unionValue: String?): CodeType =
      when (unionValue) {
        "code-128" -> CODE_128
        "code-39" -> CODE_39
        "code-93" -> CODE_93
        "codabar" -> CODABAR
        "ean-13" -> EAN_13
        "ean-8" -> EAN_8
        "itf" -> ITF
        "upc-e" -> UPC_E
        "qr" -> QR
        "pdf-417" -> PDF_417
        "aztec" -> AZTEC
        "data-matrix" -> DATA_MATRIX
        else -> throw InvalidTypeScriptUnionError("codeType", unionValue ?: "(null)")
      }
  }
}

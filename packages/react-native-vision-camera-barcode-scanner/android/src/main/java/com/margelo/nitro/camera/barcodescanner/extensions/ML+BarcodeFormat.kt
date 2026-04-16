package com.margelo.nitro.camera.barcodescanner.extensions

import com.google.mlkit.vision.barcode.common.Barcode
import com.margelo.nitro.camera.barcodescanner.BarcodeFormat
import com.margelo.nitro.camera.barcodescanner.TargetBarcodeFormat

@Barcode.BarcodeFormat
fun TargetBarcodeFormat.toMLBarcodeFormat(): Int {
  return when (this) {
    TargetBarcodeFormat.CODE_128 -> Barcode.FORMAT_CODE_128
    TargetBarcodeFormat.CODE_39 -> Barcode.FORMAT_CODE_39
    TargetBarcodeFormat.CODE_93 -> Barcode.FORMAT_CODE_93
    TargetBarcodeFormat.CODABAR -> Barcode.FORMAT_CODABAR
    TargetBarcodeFormat.DATA_MATRIX -> Barcode.FORMAT_DATA_MATRIX
    TargetBarcodeFormat.EAN_13 -> Barcode.FORMAT_EAN_13
    TargetBarcodeFormat.EAN_8 -> Barcode.FORMAT_EAN_8
    TargetBarcodeFormat.ITF -> Barcode.FORMAT_ITF
    TargetBarcodeFormat.QR_CODE -> Barcode.FORMAT_QR_CODE
    TargetBarcodeFormat.UPC_A -> Barcode.FORMAT_UPC_A
    TargetBarcodeFormat.UPC_E -> Barcode.FORMAT_UPC_E
    TargetBarcodeFormat.PDF_417 -> Barcode.FORMAT_PDF417
    TargetBarcodeFormat.AZTEC -> Barcode.FORMAT_AZTEC
    TargetBarcodeFormat.ALL_FORMATS -> Barcode.FORMAT_ALL_FORMATS
  }
}

fun BarcodeFormat.Companion.fromMLBarcodeFormat(
  @Barcode.BarcodeFormat format: Int,
): BarcodeFormat {
  return when (format) {
    Barcode.FORMAT_UNKNOWN -> BarcodeFormat.UNKNOWN
    Barcode.FORMAT_CODE_128 -> BarcodeFormat.CODE_128
    Barcode.FORMAT_CODE_39 -> BarcodeFormat.CODE_39
    Barcode.FORMAT_CODE_93 -> BarcodeFormat.CODE_93
    Barcode.FORMAT_CODABAR -> BarcodeFormat.CODABAR
    Barcode.FORMAT_DATA_MATRIX -> BarcodeFormat.DATA_MATRIX
    Barcode.FORMAT_EAN_13 -> BarcodeFormat.EAN_13
    Barcode.FORMAT_EAN_8 -> BarcodeFormat.EAN_8
    Barcode.FORMAT_ITF -> BarcodeFormat.ITF
    Barcode.FORMAT_QR_CODE -> BarcodeFormat.QR_CODE
    Barcode.FORMAT_UPC_A -> BarcodeFormat.UPC_A
    Barcode.FORMAT_UPC_E -> BarcodeFormat.UPC_E
    Barcode.FORMAT_PDF417 -> BarcodeFormat.PDF_417
    Barcode.FORMAT_AZTEC -> BarcodeFormat.AZTEC
    else -> BarcodeFormat.UNKNOWN
  }
}

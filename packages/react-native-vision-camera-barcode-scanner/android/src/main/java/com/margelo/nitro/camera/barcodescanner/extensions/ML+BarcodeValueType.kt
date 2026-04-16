package com.margelo.nitro.camera.barcodescanner.extensions

import com.google.mlkit.vision.barcode.common.Barcode
import com.margelo.nitro.camera.barcodescanner.BarcodeValueType

fun BarcodeValueType.Companion.fromMLBarcodeValueType(
  @Barcode.BarcodeValueType type: Int,
): BarcodeValueType {
  return when (type) {
    Barcode.TYPE_UNKNOWN -> BarcodeValueType.UNKNOWN
    Barcode.TYPE_CONTACT_INFO -> BarcodeValueType.CONTACT_INFO
    Barcode.TYPE_EMAIL -> BarcodeValueType.EMAIL
    Barcode.TYPE_ISBN -> BarcodeValueType.ISBN
    Barcode.TYPE_PHONE -> BarcodeValueType.PHONE
    Barcode.TYPE_PRODUCT -> BarcodeValueType.PRODUCT
    Barcode.TYPE_SMS -> BarcodeValueType.SMS
    Barcode.TYPE_TEXT -> BarcodeValueType.TEXT
    Barcode.TYPE_URL -> BarcodeValueType.URL
    Barcode.TYPE_WIFI -> BarcodeValueType.WIFI
    Barcode.TYPE_GEO -> BarcodeValueType.GEO
    Barcode.TYPE_CALENDAR_EVENT -> BarcodeValueType.CALENDAR_EVENT
    Barcode.TYPE_DRIVER_LICENSE -> BarcodeValueType.DRIVER_LICENSE
    else -> BarcodeValueType.UNKNOWN
  }
}

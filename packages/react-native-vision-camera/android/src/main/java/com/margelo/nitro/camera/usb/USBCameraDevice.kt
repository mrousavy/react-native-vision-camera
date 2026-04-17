package com.margelo.nitro.camera.usb

import android.content.Context
import android.hardware.usb.UsbDevice
import android.util.Log
import com.margelo.nitro.camera.TAG

/**
 * Represents a USB camera device (UVC compliant).
 * Wraps a UsbDevice and provides camera-specific functionality.
 */
class USBCameraDevice(
  val usbDevice: UsbDevice,
  private val context: Context
) {
  /**
   * Unique identifier for this USB camera.
   * Format: "usb-{vendorId}-{productId}-{deviceName}"
   */
  val id: String
    get() = "usb-${usbDevice.vendorId}-${usbDevice.productId}-${usbDevice.deviceName}"

  /**
   * Human-readable name for this camera.
   */
  val localizedName: String
    get() = usbDevice.productName ?: "USB Camera ${usbDevice.deviceName}"

  /**
   * Manufacturer name.
   */
  val manufacturer: String
    get() = usbDevice.manufacturerName ?: "Unknown"

  /**
   * Model identifier.
   */
  val modelID: String
    get() = "USB-${usbDevice.vendorId}-${usbDevice.productId}"

  /**
   * USB Vendor ID.
   */
  val vendorId: Int
    get() = usbDevice.vendorId

  /**
   * USB Product ID.
   */
  val productId: Int
    get() = usbDevice.productId

  /**
   * Device name (system path).
   */
  val deviceName: String
    get() = usbDevice.deviceName

  /**
   * Check if this device is the same as another USB device.
   */
  fun isSameDevice(other: UsbDevice): Boolean {
    return usbDevice.deviceName == other.deviceName
  }

  override fun toString(): String {
    return "USBCameraDevice(id='$id', name='$localizedName', vendor=$vendorId, product=$productId)"
  }

  override fun equals(other: Any?): Boolean {
    if (this === other) return true
    if (other !is USBCameraDevice) return false
    return deviceName == other.deviceName
  }

  override fun hashCode(): Int {
    return deviceName.hashCode()
  }
}

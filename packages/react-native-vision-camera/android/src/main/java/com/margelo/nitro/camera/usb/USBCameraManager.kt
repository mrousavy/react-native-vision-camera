package com.margelo.nitro.camera.usb

import android.content.Context
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager
import android.util.Log
import com.margelo.nitro.camera.TAG

/**
 * Manager for USB camera devices.
 * Handles detection and enumeration of UVC (USB Video Class) cameras.
 */
class USBCameraManager(private val context: Context) {
  private val usbManager: UsbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager

  companion object {
    // UVC (USB Video Class) constants
    private const val USB_CLASS_VIDEO = 14
    private const val USB_SUBCLASS_VIDEO_CONTROL = 1
    private const val USB_SUBCLASS_VIDEO_STREAMING = 2
  }

  /**
   * Discover all connected USB cameras (UVC devices).
   * @return List of USB camera devices
   */
  fun discoverUSBCameras(): List<USBCameraDevice> {
    val deviceList = usbManager.deviceList
    val uvcCameras = mutableListOf<USBCameraDevice>()

    for ((_, device) in deviceList) {
      if (isUVCCamera(device)) {
        Log.d(TAG, "Found UVC camera: ${device.productName} (VID: ${device.vendorId}, PID: ${device.productId})")
        uvcCameras.add(USBCameraDevice(device, context))
      }
    }

    return uvcCameras
  }

  /**
   * Check if a USB device is a UVC (USB Video Class) camera.
   * @param device USB device to check
   * @return true if device is UVC compliant
   */
  private fun isUVCCamera(device: UsbDevice): Boolean {
    // Check all interfaces for Video Control class
    for (i in 0 until device.interfaceCount) {
      val intf = device.getInterface(i)

      // UVC devices have:
      // - Interface Class: 14 (Video)
      // - Interface SubClass: 1 (Video Control) or 2 (Video Streaming)
      if (intf.interfaceClass == USB_CLASS_VIDEO &&
          (intf.interfaceSubclass == USB_SUBCLASS_VIDEO_CONTROL ||
           intf.interfaceSubclass == USB_SUBCLASS_VIDEO_STREAMING)) {
        return true
      }
    }

    return false
  }

  /**
   * Get a specific USB camera by device name.
   * @param deviceName USB device name
   * @return USB camera device or null if not found
   */
  fun getUSBCameraByName(deviceName: String): USBCameraDevice? {
    val device = usbManager.deviceList[deviceName] ?: return null
    return if (isUVCCamera(device)) {
      USBCameraDevice(device, context)
    } else {
      null
    }
  }

  /**
   * Check if USB device has been granted permission.
   * @param device USB device to check
   * @return true if permission granted
   */
  fun hasPermission(device: UsbDevice): Boolean {
    return usbManager.hasPermission(device)
  }

  /**
   * Request permission for USB device.
   * @param device USB device
   * @param permissionHelper Permission helper to handle the request
   */
  fun requestPermission(device: UsbDevice, permissionHelper: USBPermissionHelper) {
    permissionHelper.requestPermission(device)
  }
}

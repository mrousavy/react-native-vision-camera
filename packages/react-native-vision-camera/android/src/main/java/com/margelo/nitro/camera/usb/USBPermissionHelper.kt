package com.margelo.nitro.camera.usb

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager
import android.os.Build
import android.util.Log
import com.margelo.nitro.camera.TAG

/**
 * Helper class for managing USB device permissions.
 * Handles requesting and receiving USB permission callbacks.
 */
class USBPermissionHelper(private val context: Context) {
  private val usbManager: UsbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
  private var permissionListener: ((UsbDevice, Boolean) -> Unit)? = null

  companion object {
    private const val ACTION_USB_PERMISSION = "com.margelo.nitro.camera.USB_PERMISSION"
  }

  private val usbPermissionReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      if (ACTION_USB_PERMISSION == intent.action) {
        synchronized(this) {
          val device = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            intent.getParcelableExtra(UsbManager.EXTRA_DEVICE, UsbDevice::class.java)
          } else {
            @Suppress("DEPRECATION")
            intent.getParcelableExtra(UsbManager.EXTRA_DEVICE)
          }

          if (device != null) {
            val granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)
            Log.d(TAG, "USB permission for ${device.productName}: $granted")
            permissionListener?.invoke(device, granted)
          }
        }
      }
    }
  }

  /**
   * Register the permission receiver.
   * Must be called before requesting permissions.
   */
  fun register() {
    val filter = IntentFilter(ACTION_USB_PERMISSION)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      context.registerReceiver(usbPermissionReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
    } else {
      context.registerReceiver(usbPermissionReceiver, filter)
    }
  }

  /**
   * Unregister the permission receiver.
   * Should be called when no longer needed.
   */
  fun unregister() {
    try {
      context.unregisterReceiver(usbPermissionReceiver)
    } catch (e: IllegalArgumentException) {
      // Receiver not registered, ignore
    }
  }

  /**
   * Request permission for a USB device.
   * @param device USB device to request permission for
   */
  fun requestPermission(device: UsbDevice) {
    val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      PendingIntent.FLAG_MUTABLE
    } else {
      0
    }

    val permissionIntent = PendingIntent.getBroadcast(
      context,
      0,
      Intent(ACTION_USB_PERMISSION),
      flags
    )

    usbManager.requestPermission(device, permissionIntent)
  }

  /**
   * Set a listener for permission results.
   * @param listener Callback with (device, granted) parameters
   */
  fun setPermissionListener(listener: (UsbDevice, Boolean) -> Unit) {
    this.permissionListener = listener
  }

  /**
   * Check if permission is already granted for a device.
   * @param device USB device to check
   * @return true if permission is granted
   */
  fun hasPermission(device: UsbDevice): Boolean {
    return usbManager.hasPermission(device)
  }
}

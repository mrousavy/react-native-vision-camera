package com.margelo.nitro.camera.usb

import android.content.Context
import android.graphics.SurfaceTexture
import android.hardware.usb.UsbDevice
import android.util.Log
import android.view.Surface
import com.margelo.nitro.camera.TAG
import com.serenegiant.usb.IFrameCallback
import com.serenegiant.usb.USBMonitor
import com.serenegiant.usb.UVCCamera
import java.nio.ByteBuffer

/**
 * Handler for UVC camera operations.
 * Manages the UVCCamera instance and provides video streaming capabilities.
 */
class UVCCameraHandler(
  private val context: Context,
  private val usbDevice: UsbDevice
) {
  private var usbMonitor: USBMonitor? = null
  private var uvcCamera: UVCCamera? = null
  private var isOpened = false
  private var isPreviewing = false

  // Callbacks
  private var onFrameCallback: ((ByteBuffer, Int, Int) -> Unit)? = null
  private var onErrorCallback: ((String) -> Unit)? = null

  companion object {
    // Default preview sizes
    private const val DEFAULT_WIDTH = 1280
    private const val DEFAULT_HEIGHT = 720
  }

  /**
   * Open the USB camera device.
   * @param onSuccess Callback when camera is successfully opened
   * @param onError Callback when error occurs
   */
  fun open(onSuccess: () -> Unit, onError: (String) -> Unit) {
    this.onErrorCallback = onError

    try {
      // Create USB monitor
      usbMonitor = USBMonitor(context, object : USBMonitor.OnDeviceConnectListener {
        override fun onAttach(device: UsbDevice?) {
          Log.d(TAG, "UVC camera attached: ${device?.productName}")
        }

        override fun onConnect(
          device: UsbDevice?,
          ctrlBlock: USBMonitor.UsbControlBlock?,
          createNew: Boolean
        ) {
          if (device != null && ctrlBlock != null) {
            try {
              // Create UVC camera instance
              uvcCamera = UVCCamera()
              uvcCamera?.open(ctrlBlock)

              // Try to set preview size
              try {
                uvcCamera?.setPreviewSize(
                  DEFAULT_WIDTH,
                  DEFAULT_HEIGHT,
                  UVCCamera.FRAME_FORMAT_MJPEG
                )
              } catch (e: IllegalArgumentException) {
                // If MJPEG not supported, try YUYV
                Log.w(TAG, "MJPEG not supported, trying YUYV")
                uvcCamera?.setPreviewSize(
                  DEFAULT_WIDTH,
                  DEFAULT_HEIGHT,
                  UVCCamera.FRAME_FORMAT_YUYV
                )
              }

              isOpened = true
              Log.d(TAG, "UVC camera opened successfully")
              onSuccess()
            } catch (e: Exception) {
              Log.e(TAG, "Failed to open UVC camera", e)
              onError("Failed to open camera: ${e.message}")
              cleanup()
            }
          }
        }

        override fun onDisconnect(device: UsbDevice?, ctrlBlock: USBMonitor.UsbControlBlock?) {
          Log.d(TAG, "UVC camera disconnected")
          cleanup()
        }

        override fun onDetach(device: UsbDevice?) {
          Log.d(TAG, "UVC camera detached")
          cleanup()
        }

        override fun onCancel(device: UsbDevice?) {
          Log.d(TAG, "UVC camera connection cancelled")
          onError("Camera connection cancelled")
        }
      })

      // Register the USB device
      usbMonitor?.register()

      // Request permission and open
      if (usbMonitor?.hasPermission(usbDevice) == true) {
        usbMonitor?.requestPermission(usbDevice)
      } else {
        usbMonitor?.requestPermission(usbDevice)
      }
    } catch (e: Exception) {
      Log.e(TAG, "Failed to initialize UVC camera", e)
      onError("Failed to initialize: ${e.message}")
      cleanup()
    }
  }

  /**
   * Start preview to a surface.
   * @param surface Surface to render preview
   */
  fun startPreview(surface: Surface) {
    if (!isOpened) {
      onErrorCallback?.invoke("Camera not opened")
      return
    }

    try {
      uvcCamera?.setPreviewDisplay(surface)
      uvcCamera?.startPreview()
      isPreviewing = true
      Log.d(TAG, "UVC camera preview started")
    } catch (e: Exception) {
      Log.e(TAG, "Failed to start preview", e)
      onErrorCallback?.invoke("Failed to start preview: ${e.message}")
    }
  }

  /**
   * Stop preview.
   */
  fun stopPreview() {
    if (isPreviewing) {
      try {
        uvcCamera?.stopPreview()
        isPreviewing = false
        Log.d(TAG, "UVC camera preview stopped")
      } catch (e: Exception) {
        Log.e(TAG, "Failed to stop preview", e)
      }
    }
  }

  /**
   * Set frame callback to receive video frames.
   * @param callback Callback to receive frame data (buffer, width, height)
   */
  fun setFrameCallback(callback: (ByteBuffer, Int, Int) -> Unit) {
    this.onFrameCallback = callback

    uvcCamera?.setFrameCallback(object : IFrameCallback {
      override fun onFrame(frame: ByteBuffer?) {
        if (frame != null && isOpened) {
          val width = uvcCamera?.previewSize?.width ?: DEFAULT_WIDTH
          val height = uvcCamera?.previewSize?.height ?: DEFAULT_HEIGHT
          callback(frame, width, height)
        }
      }
    }, UVCCamera.PIXEL_FORMAT_YUV420SP)
  }

  /**
   * Capture a still image.
   * @param callback Callback to receive image data
   */
  fun captureStillImage(callback: (ByteBuffer?) -> Unit) {
    if (!isOpened) {
      callback(null)
      return
    }

    try {
      // For UVC cameras, we capture from the current frame
      uvcCamera?.setFrameCallback(object : IFrameCallback {
        override fun onFrame(frame: ByteBuffer?) {
          // Get one frame and remove callback
          callback(frame)
          uvcCamera?.setFrameCallback(null, 0)
        }
      }, UVCCamera.PIXEL_FORMAT_MJPEG)
    } catch (e: Exception) {
      Log.e(TAG, "Failed to capture image", e)
      callback(null)
    }
  }

  /**
   * Get current preview size.
   * @return Pair of (width, height) or null if not available
   */
  fun getPreviewSize(): Pair<Int, Int>? {
    val size = uvcCamera?.previewSize
    return if (size != null) {
      Pair(size.width, size.height)
    } else {
      null
    }
  }

  /**
   * Get supported preview sizes.
   * @return List of supported sizes
   */
  fun getSupportedSizes(): List<Pair<Int, Int>> {
    val sizes = mutableListOf<Pair<Int, Int>>()

    try {
      uvcCamera?.supportedSizeList?.forEach { size ->
        sizes.add(Pair(size.width, size.height))
      }
    } catch (e: Exception) {
      Log.w(TAG, "Failed to get supported sizes", e)
    }

    // Add common sizes as fallback
    if (sizes.isEmpty()) {
      sizes.add(Pair(1920, 1080))
      sizes.add(Pair(1280, 720))
      sizes.add(Pair(640, 480))
    }

    return sizes
  }

  /**
   * Check if camera is currently opened.
   */
  fun isOpened(): Boolean = isOpened

  /**
   * Check if preview is running.
   */
  fun isPreviewing(): Boolean = isPreviewing

  /**
   * Close the camera and release resources.
   */
  fun close() {
    cleanup()
  }

  private fun cleanup() {
    try {
      stopPreview()
      uvcCamera?.close()
      uvcCamera?.destroy()
      uvcCamera = null
    } catch (e: Exception) {
      Log.e(TAG, "Error closing UVC camera", e)
    }

    try {
      usbMonitor?.unregister()
      usbMonitor?.destroy()
      usbMonitor = null
    } catch (e: Exception) {
      Log.e(TAG, "Error destroying USB monitor", e)
    }

    isOpened = false
    isPreviewing = false
  }
}

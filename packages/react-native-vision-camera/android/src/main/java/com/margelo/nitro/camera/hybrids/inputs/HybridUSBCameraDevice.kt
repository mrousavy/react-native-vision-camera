package com.margelo.nitro.camera.hybrids.inputs

import android.content.Context
import com.margelo.nitro.camera.CameraPosition
import com.margelo.nitro.camera.DeviceType
import com.margelo.nitro.camera.DynamicRange
import com.margelo.nitro.camera.HybridCameraDeviceSpec
import com.margelo.nitro.camera.HybridCameraOutputSpec
import com.margelo.nitro.camera.HybridCameraSessionConfigSpec
import com.margelo.nitro.camera.MediaType
import com.margelo.nitro.camera.OutputStreamType
import com.margelo.nitro.camera.PixelFormat
import com.margelo.nitro.camera.Range
import com.margelo.nitro.camera.Size
import com.margelo.nitro.camera.TargetStabilizationMode
import com.margelo.nitro.camera.usb.USBCameraDevice

/**
 * Hybrid wrapper for USB camera devices.
 * Implements HybridCameraDeviceSpec to expose USB cameras to JavaScript.
 */
class HybridUSBCameraDevice(
  val usbCamera: USBCameraDevice,
  private val context: Context
) : HybridCameraDeviceSpec() {

  // Device Metadata
  override val id: String
    get() = usbCamera.id

  override val modelID: String
    get() = usbCamera.modelID

  override val localizedName: String
    get() = usbCamera.localizedName

  override val manufacturer: String
    get() = usbCamera.manufacturer

  override val type: DeviceType
    get() = DeviceType.EXTERNAL

  override val position: CameraPosition
    get() = CameraPosition.EXTERNAL

  override val physicalDevices: Array<HybridCameraDeviceSpec>
    get() = emptyArray()

  override val isVirtualDevice: Boolean
    get() = false

  // Output Capabilities
  override val supportedPixelFormats: Array<PixelFormat>
    get() = arrayOf(
      PixelFormat.YUV,
      PixelFormat.NATIVE
    )

  override fun getSupportedResolutions(outputStreamType: OutputStreamType): Array<Size> {
    // Return common USB camera resolutions
    return arrayOf(
      Size(1920.0, 1080.0),
      Size(1280.0, 720.0),
      Size(640.0, 480.0)
    )
  }

  override fun supportsOutput(output: HybridCameraOutputSpec): Boolean {
    // USB cameras support photo and video outputs
    return true
  }

  // Capabilities
  override val supportsPhotoHDR: Boolean = false

  override val supportedVideoDynamicRanges: Array<DynamicRange>
    get() = arrayOf(DynamicRange.SDR)

  override val supportedFPSRanges: Array<Range>
    get() = arrayOf(
      Range(15.0, 30.0),
      Range(30.0, 30.0)
    )

  override fun supportsFPS(fps: Double): Boolean {
    return fps <= 30.0
  }

  override fun supportsVideoStabilizationMode(
    videoStabilizationMode: TargetStabilizationMode
  ): Boolean = false

  override fun supportsPreviewStabilizationMode(
    previewStabilizationMode: TargetStabilizationMode
  ): Boolean = false

  override val supportsPreviewImage: Boolean = false
  override val supportsSpeedQualityPrioritization: Boolean = false

  // Focal Length
  override val focalLength: Double? = null
  override val lensAperture: Double = 2.8

  // Continuity Camera (iOS only)
  override val isContinuityCamera: Boolean = false
  override val companionDeskViewCamera: HybridCameraDeviceSpec? = null

  // Media Types
  override val mediaTypes: Array<MediaType>
    get() = arrayOf(MediaType.VIDEO)

  // Focus
  override val supportsFocusMetering: Boolean = false
  override val supportsFocusLocking: Boolean = false
  override val supportsSmoothAutoFocus: Boolean = false

  // Exposure
  override val supportsExposureMetering: Boolean = false
  override val supportsExposureLocking: Boolean = false
  override val supportsExposureBias: Boolean = false
  override val minExposureBias: Double = 0.0
  override val maxExposureBias: Double = 0.0

  // White Balance
  override val supportsWhiteBalanceMetering: Boolean = false
  override val maxWhiteBalanceGain: Double = 1.0
  override val supportsWhiteBalanceLocking: Boolean = false

  // Flash
  override val hasFlash: Boolean = false
  override val hasTorch: Boolean = false

  // Low Light Boost
  override val supportsLowLightBoost: Boolean = false

  // Zoom
  override val minZoom: Double = 1.0
  override val maxZoom: Double = 1.0
  override val zoomLensSwitchFactors: Array<Double> = emptyArray()
  override val supportsDistortionCorrection: Boolean = false

  override fun isSessionConfigSupported(config: HybridCameraSessionConfigSpec): Boolean {
    // Basic validation - USB cameras support most configurations
    return true
  }

  override fun equals(other: Any?): Boolean {
    if (this === other) return true
    if (other !is HybridUSBCameraDevice) return false
    return id == other.id
  }

  override fun hashCode(): Int {
    return id.hashCode()
  }
}

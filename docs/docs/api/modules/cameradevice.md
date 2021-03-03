---
id: "cameradevice"
title: "Module: CameraDevice"
sidebar_label: "CameraDevice"
custom_edit_url: null
hide_title: true
---

# Module: CameraDevice

## Type aliases

### AutoFocusSystem

Ƭ **AutoFocusSystem**: *contrast-detection* \| *phase-detection* \| *none*

Indicates a format's autofocus system.

* `"none"`: Indicates that autofocus is not available
* `"contrast-detection"`: Indicates that autofocus is achieved by contrast detection. Contrast detection performs a focus scan to find the optimal position
* `"phase-detection"`: Indicates that autofocus is achieved by phase detection. Phase detection has the ability to achieve focus in many cases without a focus scan. Phase detection autofocus is typically less visually intrusive than contrast detection autofocus

Defined in: [src/CameraDevice.ts:64](https://github.com/cuvent/react-native-vision-camera/blob/c314255/src/CameraDevice.ts#L64)

___

### CameraDevice

Ƭ **CameraDevice**: *Readonly*<{ `devices`: [*PhysicalCameraDeviceType*](cameradevice.md#physicalcameradevicetype)[] ; `formats`: [*CameraDeviceFormat*](cameradevice.md#cameradeviceformat)[] ; `hasFlash`: *boolean* ; `hasTorch`: *boolean* ; `id`: *string* ; `isMultiCam`: *boolean* ; `maxZoom`: *number* ; `minZoom`: *number* ; `name`: *string* ; `neutralZoom`: *number* ; `position`: [*CameraPosition*](cameraposition.md#cameraposition) ; `supportsLowLightBoost`: *boolean*  }\>

Represents a camera device discovered by the `Camera.getAvailableCameraDevices()` function

Defined in: [src/CameraDevice.ts:159](https://github.com/cuvent/react-native-vision-camera/blob/c314255/src/CameraDevice.ts#L159)

___

### CameraDeviceFormat

Ƭ **CameraDeviceFormat**: *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: [*FrameRateRange*](cameradevice.md#frameraterange)[] ; `isHighestPhotoQualitySupported?`: *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *number*  }\>

A Camera Device's video format. Do not create instances of this type yourself, only use `Camera.getAvailableCameraDevices(...)`.

Defined in: [src/CameraDevice.ts:85](https://github.com/cuvent/react-native-vision-camera/blob/c314255/src/CameraDevice.ts#L85)

___

### ColorSpace

Ƭ **ColorSpace**: *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv*

Indicates a format's color space.

#### The following colorspaces are available on iOS:
* `"srgb"`: The sGRB color space (https://www.w3.org/Graphics/Color/srgb)
* `"p3-d65"`: The P3 D65 wide color space which uses Illuminant D65 as the white point
* `"hlg-bt2020"`: The BT2020 wide color space which uses Illuminant D65 as the white point and Hybrid Log-Gamma as the transfer function

#### The following colorspaces are available on Android:
* `"yuv"`: The YCbCr color space.

Defined in: [src/CameraDevice.ts:55](https://github.com/cuvent/react-native-vision-camera/blob/c314255/src/CameraDevice.ts#L55)

___

### FrameRateRange

Ƭ **FrameRateRange**: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>

Defined in: [src/CameraDevice.ts:77](https://github.com/cuvent/react-native-vision-camera/blob/c314255/src/CameraDevice.ts#L77)

___

### LogicalCameraDeviceType

Ƭ **LogicalCameraDeviceType**: *dual-camera* \| *dual-wide-camera* \| *triple-camera* \| *true-depth-camera*

Indentifiers for a logical camera (Combinations of multiple physical cameras to create a single logical camera).

* `"dual-camera"`: A combination of wide-angle and telephoto cameras that creates a capture device.
* `"dual-wide-camera"`: A device that consists of two cameras of fixed focal length, one ultrawide angle and one wide angle.
* `"triple-camera"`: A device that consists of three cameras of fixed focal length, one ultrawide angle, one wide angle, and one telephoto.
* `"true-depth-camera"`: A combination of cameras and other sensors that creates a capture device capable of photo, video, and depth capture.

Defined in: [src/CameraDevice.ts:20](https://github.com/cuvent/react-native-vision-camera/blob/c314255/src/CameraDevice.ts#L20)

___

### PhysicalCameraDeviceType

Ƭ **PhysicalCameraDeviceType**: *ultra-wide-angle-camera* \| *wide-angle-camera* \| *telephoto-camera*

Indentifiers for a physical camera (one that actually exists on the back/front of the device)

* `"ultra-wide-angle-camera"`: A built-in camera with a shorter focal length than that of a wide-angle camera. (focal length between below 24mm)
* `"wide-angle-camera"`: A built-in wide-angle camera. (focal length between 24mm and 35mm)
* `"telephoto-camera"`: A built-in camera device with a longer focal length than a wide-angle camera. (focal length between above 85mm)

Defined in: [src/CameraDevice.ts:10](https://github.com/cuvent/react-native-vision-camera/blob/c314255/src/CameraDevice.ts#L10)

___

### VideoStabilizationMode

Ƭ **VideoStabilizationMode**: *off* \| *standard* \| *cinematic* \| *cinematic-extended* \| *auto*

Indicates a format's supported video stabilization mode

* `"off"`: Indicates that video should not be stabilized
* `"standard"`: Indicates that video should be stabilized using the standard video stabilization algorithm introduced with iOS 5.0. Standard video stabilization has a reduced field of view. Enabling video stabilization may introduce additional latency into the video capture pipeline
* `"cinematic"`: Indicates that video should be stabilized using the cinematic stabilization algorithm for more dramatic results. Cinematic video stabilization has a reduced field of view compared to standard video stabilization. Enabling cinematic video stabilization introduces much more latency into the video capture pipeline than standard video stabilization and consumes significantly more system memory. Use narrow or identical min and max frame durations in conjunction with this mode
* `"cinematic-extended"`: Indicates that the video should be stabilized using the extended cinematic stabilization algorithm. Enabling extended cinematic stabilization introduces longer latency into the video capture pipeline compared to the AVCaptureVideoStabilizationModeCinematic and consumes more memory, but yields improved stability. It is recommended to use identical or similar min and max frame durations in conjunction with this mode (iOS 13.0+)
* `"auto"`: Indicates that the most appropriate video stabilization mode for the device and format should be chosen automatically

Defined in: [src/CameraDevice.ts:75](https://github.com/cuvent/react-native-vision-camera/blob/c314255/src/CameraDevice.ts#L75)

## Functions

### parsePhysicalDeviceTypes

▸ `Const`**parsePhysicalDeviceTypes**(`physicalDeviceTypes`: [*PhysicalCameraDeviceType*](cameradevice.md#physicalcameradevicetype)[]): *ultra-wide-angle-camera* \| *wide-angle-camera* \| *telephoto-camera* \| *dual-camera* \| *dual-wide-camera* \| *triple-camera* \| *true-depth-camera*

Parses an array of physical device types into a single `PhysicalCameraDeviceType` or `LogicalCameraDeviceType`, depending what matches.

**`method`** 

#### Parameters:

Name | Type |
:------ | :------ |
`physicalDeviceTypes` | [*PhysicalCameraDeviceType*](cameradevice.md#physicalcameradevicetype)[] |

**Returns:** *ultra-wide-angle-camera* \| *wide-angle-camera* \| *telephoto-camera* \| *dual-camera* \| *dual-wide-camera* \| *triple-camera* \| *true-depth-camera*

Defined in: [src/CameraDevice.ts:26](https://github.com/cuvent/react-native-vision-camera/blob/c314255/src/CameraDevice.ts#L26)

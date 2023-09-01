---
id: "index"
title: "VisionCamera"
sidebar_label: "Overview"
sidebar_position: 0.5
custom_edit_url: null
---

## Classes

- [Camera](classes/Camera.md)
- [CameraCaptureError](classes/CameraCaptureError.md)
- [CameraRuntimeError](classes/CameraRuntimeError.md)

## Interfaces

- [CameraDevice](interfaces/CameraDevice.md)
- [CameraDeviceFormat](interfaces/CameraDeviceFormat.md)
- [CameraProps](interfaces/CameraProps.md)
- [ErrorWithCause](interfaces/ErrorWithCause.md)
- [Frame](interfaces/Frame.md)
- [FrameProcessorPerformanceSuggestion](interfaces/FrameProcessorPerformanceSuggestion.md)
- [FrameRateRange](interfaces/FrameRateRange.md)
- [PhotoFile](interfaces/PhotoFile.md)
- [Point](interfaces/Point.md)
- [RecordVideoOptions](interfaces/RecordVideoOptions.md)
- [TakePhotoOptions](interfaces/TakePhotoOptions.md)
- [TakeSnapshotOptions](interfaces/TakeSnapshotOptions.md)
- [TemporaryFile](interfaces/TemporaryFile.md)
- [VideoFile](interfaces/VideoFile.md)

## Type Aliases

### AutoFocusSystem

Ƭ **AutoFocusSystem**: ``"contrast-detection"`` \| ``"phase-detection"`` \| ``"none"``

Indicates a format's autofocus system.

* `"none"`: Indicates that autofocus is not available
* `"contrast-detection"`: Indicates that autofocus is achieved by contrast detection. Contrast detection performs a focus scan to find the optimal position
* `"phase-detection"`: Indicates that autofocus is achieved by phase detection. Phase detection has the ability to achieve focus in many cases without a focus scan. Phase detection autofocus is typically less visually intrusive than contrast detection autofocus

#### Defined in

[CameraDevice.ts:89](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L89)

___

### CameraDevices

Ƭ **CameraDevices**: { [key in CameraPosition]: CameraDevice \| undefined }

#### Defined in

[hooks/useCameraDevices.ts:7](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/hooks/useCameraDevices.ts#L7)

___

### CameraPermissionRequestResult

Ƭ **CameraPermissionRequestResult**: ``"authorized"`` \| ``"denied"``

#### Defined in

[Camera.tsx:16](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/Camera.tsx#L16)

___

### CameraPermissionStatus

Ƭ **CameraPermissionStatus**: ``"authorized"`` \| ``"not-determined"`` \| ``"denied"`` \| ``"restricted"``

#### Defined in

[Camera.tsx:15](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/Camera.tsx#L15)

___

### CameraPosition

Ƭ **CameraPosition**: ``"front"`` \| ``"back"`` \| ``"unspecified"`` \| ``"external"``

Represents the camera device position.

* `"back"`: Indicates that the device is physically located on the back of the system hardware
* `"front"`: Indicates that the device is physically located on the front of the system hardware

#### iOS only
* `"unspecified"`: Indicates that the device's position relative to the system hardware is unspecified

#### Android only
* `"external"`: The camera device is an external camera, and has no fixed facing relative to the device's screen. (Android only)

#### Defined in

[CameraPosition.ts:13](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraPosition.ts#L13)

___

### CameraPreset

Ƭ **CameraPreset**: ``"cif-352x288"`` \| ``"hd-1280x720"`` \| ``"hd-1920x1080"`` \| ``"hd-3840x2160"`` \| ``"high"`` \| ``"iframe-1280x720"`` \| ``"iframe-960x540"`` \| ``"input-priority"`` \| ``"low"`` \| ``"medium"`` \| ``"photo"`` \| ``"vga-640x480"``

Indicates the quality level or bit rate of the output.

* `"cif-352x288"`: Specifies capture settings suitable for CIF quality (352 x 288 pixel) video output
* `"hd-1280x720"`: Specifies capture settings suitable for 720p quality (1280 x 720 pixel) video output.
* `"hd-1920x1080"`: Capture settings suitable for 1080p-quality (1920 x 1080 pixels) video output.
* `"hd-3840x2160"`: Capture settings suitable for 2160p-quality (3840 x 2160 pixels, "4k") video output.
* `"high"`: Specifies capture settings suitable for high-quality video and audio output.
* `"iframe-1280x720"`: Specifies capture settings to achieve 1280 x 720 quality iFrame H.264 video at about 40 Mbits/sec with AAC audio.
* `"iframe-960x540"`: Specifies capture settings to achieve 960 x 540 quality iFrame H.264 video at about 30 Mbits/sec with AAC audio.
* `"input-priority"`: Specifies that the capture session does not control audio and video output settings.
* `"low"`: Specifies capture settings suitable for output video and audio bit rates suitable for sharing over 3G.
* `"medium"`: Specifies capture settings suitable for output video and audio bit rates suitable for sharing over WiFi.
* `"photo"`: Specifies capture settings suitable for high-resolution photo quality output.
* `"vga-640x480"`: Specifies capture settings suitable for VGA quality (640 x 480 pixel) video output.

#### Defined in

[CameraPreset.ts:17](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraPreset.ts#L17)

___

### CameraVideoCodec

Ƭ **CameraVideoCodec**: ``"h264"`` \| ``"hevc"`` \| ``"hevc-alpha"`` \| ``"jpeg"`` \| ``"pro-res-4444"`` \| ``"pro-res-422"`` \| ``"pro-res-422-hq"`` \| ``"pro-res-422-lt"`` \| ``"pro-res-422-proxy"``

#### Defined in

[VideoFile.ts:6](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/VideoFile.ts#L6)

___

### CaptureError

Ƭ **CaptureError**: ``"capture/invalid-photo-format"`` \| ``"capture/encoder-error"`` \| ``"capture/muxer-error"`` \| ``"capture/recording-in-progress"`` \| ``"capture/no-recording-in-progress"`` \| ``"capture/file-io-error"`` \| ``"capture/create-temp-file-error"`` \| ``"capture/invalid-video-options"`` \| ``"capture/create-recorder-error"`` \| ``"capture/recorder-error"`` \| ``"capture/no-valid-data"`` \| ``"capture/inactive-source"`` \| ``"capture/insufficient-storage"`` \| ``"capture/file-size-limit-reached"`` \| ``"capture/invalid-photo-codec"`` \| ``"capture/not-bound-error"`` \| ``"capture/capture-type-not-supported"`` \| ``"capture/video-not-enabled"`` \| ``"capture/photo-not-enabled"`` \| ``"capture/aborted"`` \| ``"capture/unknown"``

#### Defined in

[CameraError.ts:31](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraError.ts#L31)

___

### ColorSpace

Ƭ **ColorSpace**: ``"hlg-bt2020"`` \| ``"p3-d65"`` \| ``"srgb"`` \| ``"yuv"`` \| ``"jpeg"`` \| ``"jpeg-depth"`` \| ``"raw"`` \| ``"heic"`` \| ``"private"`` \| ``"depth-16"`` \| ``"unknown"``

Indicates a format's color space.

#### The following colorspaces are available on iOS:
* `"srgb"`: The sGRB color space.
* `"p3-d65"`: The P3 D65 wide color space which uses Illuminant D65 as the white point
* `"hlg-bt2020"`: The BT2020 wide color space which uses Illuminant D65 as the white point and Hybrid Log-Gamma as the transfer function

> See ["AVCaptureColorSpace"](https://developer.apple.com/documentation/avfoundation/avcapturecolorspace) for more information.

#### The following colorspaces are available on Android:
* `"yuv"`: The Multi-plane Android YCbCr color space. (YUV 420_888, 422_888 or 444_888)
* `"jpeg"`: The compressed JPEG color space.
* `"jpeg-depth"`: The compressed JPEG color space including depth data.
* `"raw"`: The Camera's RAW sensor color space. (Single-channel Bayer-mosaic image, usually 16 bit)
* `"heic"`: The compressed HEIC color space.
* `"private"`: The Android private opaque image format. (The choices of the actual format and pixel data layout are entirely up to the device-specific and framework internal implementations, and may vary depending on use cases even for the same device. These buffers are not directly accessible to the application)
* `"depth-16"`: The Android dense depth image format (16 bit)
* `"unknown"`: Placeholder for an unknown image/pixel format. [Edit this file](https://github.com/mrousavy/react-native-vision-camera/edit/main/android/src/main/java/com/mrousavy/camera/parsers/ImageFormat+String.kt) to add a name for the unknown format.

> See ["Android Color Formats"](https://jbit.net/Android_Colors/) for more information.

#### Defined in

[CameraDevice.ts:67](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L67)

___

### DeviceError

Ƭ **DeviceError**: ``"device/configuration-error"`` \| ``"device/no-device"`` \| ``"device/invalid-device"`` \| ``"device/parallel-video-processing-not-supported"`` \| ``"device/torch-unavailable"`` \| ``"device/microphone-unavailable"`` \| ``"device/low-light-boost-not-supported"`` \| ``"device/focus-not-supported"`` \| ``"device/camera-not-available-on-simulator"``

#### Defined in

[CameraError.ts:8](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraError.ts#L8)

___

### FormatError

Ƭ **FormatError**: ``"format/invalid-fps"`` \| ``"format/invalid-hdr"`` \| ``"format/invalid-low-light-boost"`` \| ``"format/invalid-format"`` \| ``"format/invalid-color-space"`` \| ``"format/invalid-preset"``

#### Defined in

[CameraError.ts:19](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraError.ts#L19)

___

### FrameProcessorError

Ƭ **FrameProcessorError**: ``"frame-processor/unavailable"``

#### Defined in

[CameraError.ts:18](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraError.ts#L18)

___

### LogicalCameraDeviceType

Ƭ **LogicalCameraDeviceType**: ``"dual-camera"`` \| ``"dual-wide-camera"`` \| ``"triple-camera"``

Indentifiers for a logical camera (Combinations of multiple physical cameras to create a single logical camera).

* `"dual-camera"`: A combination of wide-angle and telephoto cameras that creates a capture device.
* `"dual-wide-camera"`: A device that consists of two cameras of fixed focal length, one ultrawide angle and one wide angle.
* `"triple-camera"`: A device that consists of three cameras of fixed focal length, one ultrawide angle, one wide angle, and one telephoto.

#### Defined in

[CameraDevice.ts:20](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L20)

___

### ParameterError

Ƭ **ParameterError**: ``"parameter/invalid-parameter"`` \| ``"parameter/unsupported-os"`` \| ``"parameter/unsupported-output"`` \| ``"parameter/unsupported-input"`` \| ``"parameter/invalid-combination"``

#### Defined in

[CameraError.ts:2](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraError.ts#L2)

___

### PermissionError

Ƭ **PermissionError**: ``"permission/microphone-permission-denied"`` \| ``"permission/camera-permission-denied"``

#### Defined in

[CameraError.ts:1](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraError.ts#L1)

___

### PhysicalCameraDeviceType

Ƭ **PhysicalCameraDeviceType**: ``"ultra-wide-angle-camera"`` \| ``"wide-angle-camera"`` \| ``"telephoto-camera"``

Indentifiers for a physical camera (one that actually exists on the back/front of the device)

* `"ultra-wide-angle-camera"`: A built-in camera with a shorter focal length than that of a wide-angle camera. (focal length between below 24mm)
* `"wide-angle-camera"`: A built-in wide-angle camera. (focal length between 24mm and 35mm)
* `"telephoto-camera"`: A built-in camera device with a longer focal length than a wide-angle camera. (focal length between above 85mm)

#### Defined in

[CameraDevice.ts:11](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L11)

___

### SessionError

Ƭ **SessionError**: ``"session/camera-not-ready"`` \| ``"session/audio-session-setup-failed"`` \| ``"session/audio-in-use-by-other-app"`` \| ``"session/audio-session-failed-to-activate"``

#### Defined in

[CameraError.ts:26](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraError.ts#L26)

___

### SystemError

Ƭ **SystemError**: ``"system/no-camera-manager"`` \| ``"system/view-not-found"``

#### Defined in

[CameraError.ts:53](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraError.ts#L53)

___

### UnknownError

Ƭ **UnknownError**: ``"unknown/unknown"``

#### Defined in

[CameraError.ts:54](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraError.ts#L54)

___

### VideoFileType

Ƭ **VideoFileType**: ``"mov"`` \| ``"avci"`` \| ``"m4v"`` \| ``"mp4"``

#### Defined in

[VideoFile.ts:4](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/VideoFile.ts#L4)

___

### VideoStabilizationMode

Ƭ **VideoStabilizationMode**: ``"off"`` \| ``"standard"`` \| ``"cinematic"`` \| ``"cinematic-extended"`` \| ``"auto"``

Indicates a format's supported video stabilization mode

* `"off"`: Indicates that video should not be stabilized
* `"standard"`: Indicates that video should be stabilized using the standard video stabilization algorithm introduced with iOS 5.0. Standard video stabilization has a reduced field of view. Enabling video stabilization may introduce additional latency into the video capture pipeline
* `"cinematic"`: Indicates that video should be stabilized using the cinematic stabilization algorithm for more dramatic results. Cinematic video stabilization has a reduced field of view compared to standard video stabilization. Enabling cinematic video stabilization introduces much more latency into the video capture pipeline than standard video stabilization and consumes significantly more system memory. Use narrow or identical min and max frame durations in conjunction with this mode
* `"cinematic-extended"`: Indicates that the video should be stabilized using the extended cinematic stabilization algorithm. Enabling extended cinematic stabilization introduces longer latency into the video capture pipeline compared to the AVCaptureVideoStabilizationModeCinematic and consumes more memory, but yields improved stability. It is recommended to use identical or similar min and max frame durations in conjunction with this mode (iOS 13.0+)
* `"auto"`: Indicates that the most appropriate video stabilization mode for the device and format should be chosen automatically

#### Defined in

[CameraDevice.ts:100](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L100)

## Functions

### frameRateIncluded

▸ **frameRateIncluded**(`range`, `fps`): `boolean`

Returns `true` if the given Frame Rate Range (`range`) contains the given frame rate (`fps`)

**`Example`**

```ts
// get all formats that support 60 FPS
const formatsWithHighFps = useMemo(() => device.formats.filter((f) => f.frameRateRanges.some((r) => frameRateIncluded(r, 60))), [device.formats])
```

**`Method`**

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `range` | [`FrameRateRange`](interfaces/FrameRateRange.md) | The range to check if the given `fps` are included in |
| `fps` | `number` | The FPS to check if the given `range` supports. |

#### Returns

`boolean`

#### Defined in

[utils/FormatFilter.ts:85](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/utils/FormatFilter.ts#L85)

___

### isErrorWithCause

▸ **isErrorWithCause**(`error`): error is ErrorWithCause

Checks if the given `error` is of type [`ErrorWithCause`](interfaces/ErrorWithCause.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `error` | `unknown` | Any unknown object to validate |

#### Returns

error is ErrorWithCause

`true` if the given `error` is of type [`ErrorWithCause`](interfaces/ErrorWithCause.md)

#### Defined in

[CameraError.ts:173](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraError.ts#L173)

___

### parsePhysicalDeviceTypes

▸ **parsePhysicalDeviceTypes**(`physicalDeviceTypes`): [`PhysicalCameraDeviceType`](#physicalcameradevicetype) \| [`LogicalCameraDeviceType`](#logicalcameradevicetype)

Parses an array of physical device types into a single [`PhysicalCameraDeviceType`](#physicalcameradevicetype) or [`LogicalCameraDeviceType`](#logicalcameradevicetype), depending what matches.

**`Method`**

#### Parameters

| Name | Type |
| :------ | :------ |
| `physicalDeviceTypes` | [`PhysicalCameraDeviceType`](#physicalcameradevicetype)[] |

#### Returns

[`PhysicalCameraDeviceType`](#physicalcameradevicetype) \| [`LogicalCameraDeviceType`](#logicalcameradevicetype)

#### Defined in

[CameraDevice.ts:26](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L26)

___

### sortDevices

▸ **sortDevices**(`left`, `right`): `number`

Compares two devices by the following criteria:
* `wide-angle-camera`s are ranked higher than others
* Devices with more physical cameras are ranked higher than ones with less. (e.g. "Triple Camera" > "Wide-Angle Camera")

> Note that this makes the `sort()` function descending, so the first element (`[0]`) is the "best" device.

**`Example`**

```ts
const devices = camera.devices.sort(sortDevices)
const bestDevice = devices[0]
```

**`Method`**

#### Parameters

| Name | Type |
| :------ | :------ |
| `left` | [`CameraDevice`](interfaces/CameraDevice.md) |
| `right` | [`CameraDevice`](interfaces/CameraDevice.md) |

#### Returns

`number`

#### Defined in

[utils/FormatFilter.ts:18](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/utils/FormatFilter.ts#L18)

___

### sortFormats

▸ **sortFormats**(`left`, `right`): `number`

Sort formats by resolution and aspect ratio difference (to the Screen size).

> Note that this makes the `sort()` function descending, so the first element (`[0]`) is the "best" device.

#### Parameters

| Name | Type |
| :------ | :------ |
| `left` | [`CameraDeviceFormat`](interfaces/CameraDeviceFormat.md) |
| `right` | [`CameraDeviceFormat`](interfaces/CameraDeviceFormat.md) |

#### Returns

`number`

#### Defined in

[utils/FormatFilter.ts:50](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/utils/FormatFilter.ts#L50)

___

### tryParseNativeCameraError

▸ **tryParseNativeCameraError**<`T`\>(`nativeError`): [`CameraCaptureError`](classes/CameraCaptureError.md) \| [`CameraRuntimeError`](classes/CameraRuntimeError.md) \| `T`

Tries to parse an error coming from native to a typed JS camera error.

**`Method`**

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `nativeError` | `T` | The native error instance. This is a JSON in the legacy native module architecture. |

#### Returns

[`CameraCaptureError`](classes/CameraCaptureError.md) \| [`CameraRuntimeError`](classes/CameraRuntimeError.md) \| `T`

A [`CameraRuntimeError`](classes/CameraRuntimeError.md) or [`CameraCaptureError`](classes/CameraCaptureError.md), or the `nativeError` itself if it's not parsable

#### Defined in

[CameraError.ts:199](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraError.ts#L199)

___

### useCameraDevices

▸ **useCameraDevices**(): [`CameraDevices`](#cameradevices)

Gets the best available [`CameraDevice`](interfaces/CameraDevice.md). Devices with more cameras are preferred.

**`Throws`**

[`CameraRuntimeError`](classes/CameraRuntimeError.md) if no device was found.

**`Example`**

```tsx
const device = useCameraDevice()
// ...
return <Camera device={device} />
```

#### Returns

[`CameraDevices`](#cameradevices)

The best matching [`CameraDevice`](interfaces/CameraDevice.md).

#### Defined in

[hooks/useCameraDevices.ts:29](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/hooks/useCameraDevices.ts#L29)

▸ **useCameraDevices**(`deviceType`): [`CameraDevices`](#cameradevices)

Gets a [`CameraDevice`](interfaces/CameraDevice.md) for the requested device type.

**`Throws`**

[`CameraRuntimeError`](classes/CameraRuntimeError.md) if no device was found.

**`Example`**

```tsx
const device = useCameraDevice('wide-angle-camera')
// ...
return <Camera device={device} />
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `deviceType` | [`PhysicalCameraDeviceType`](#physicalcameradevicetype) \| [`LogicalCameraDeviceType`](#logicalcameradevicetype) | Specifies a device type which will be used as a device filter. |

#### Returns

[`CameraDevices`](#cameradevices)

A [`CameraDevice`](interfaces/CameraDevice.md) for the requested device type.

#### Defined in

[hooks/useCameraDevices.ts:44](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/hooks/useCameraDevices.ts#L44)

___

### useCameraFormat

▸ **useCameraFormat**(`device?`): [`CameraDeviceFormat`](interfaces/CameraDeviceFormat.md) \| `undefined`

Returns the best format for the given camera device.

This function tries to choose a format with the highest possible photo-capture resolution and best matching aspect ratio.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `device?` | [`CameraDevice`](interfaces/CameraDevice.md) | The Camera Device |

#### Returns

[`CameraDeviceFormat`](interfaces/CameraDeviceFormat.md) \| `undefined`

The best matching format for the given camera device, or `undefined` if the camera device is `undefined`.

#### Defined in

[hooks/useCameraFormat.ts:14](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/hooks/useCameraFormat.ts#L14)

___

### useFrameProcessor

▸ **useFrameProcessor**(`frameProcessor`, `dependencies`): `FrameProcessor`

Returns a memoized Frame Processor function wich you can pass to the `<Camera>`. (See ["Frame Processors"](https://react-native-vision-camera.com/docs/guides/frame-processors))

Make sure to add the `'worklet'` directive to the top of the Frame Processor function, otherwise it will not get compiled into a worklet.

**`Example`**

```ts
const frameProcessor = useFrameProcessor((frame) => {
  'worklet'
  const qrCodes = scanQRCodes(frame)
  console.log(`QR Codes: ${qrCodes}`)
}, [])
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `frameProcessor` | `FrameProcessor` | The Frame Processor |
| `dependencies` | `DependencyList` | The React dependencies which will be copied into the VisionCamera JS-Runtime. |

#### Returns

`FrameProcessor`

The memoized Frame Processor.

#### Defined in

[hooks/useFrameProcessor.ts:27](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/hooks/useFrameProcessor.ts#L27)

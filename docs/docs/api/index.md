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
- [PhotoFile](interfaces/PhotoFile.md)
- [Point](interfaces/Point.md)
- [RecordVideoOptions](interfaces/RecordVideoOptions.md)
- [TakePhotoOptions](interfaces/TakePhotoOptions.md)
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

[CameraDevice.ts:53](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L53)

___

### CameraDevices

Ƭ **CameraDevices**: { [key in CameraPosition]: CameraDevice \| undefined }

#### Defined in

[hooks/useCameraDevices.ts:7](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/hooks/useCameraDevices.ts#L7)

___

### CameraPermissionRequestResult

Ƭ **CameraPermissionRequestResult**: ``"granted"`` \| ``"denied"``

#### Defined in

[Camera.tsx:15](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/Camera.tsx#L15)

___

### CameraPermissionStatus

Ƭ **CameraPermissionStatus**: ``"granted"`` \| ``"not-determined"`` \| ``"denied"`` \| ``"restricted"``

#### Defined in

[Camera.tsx:14](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/Camera.tsx#L14)

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

[CameraPosition.ts:13](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraPosition.ts#L13)

___

### CaptureError

Ƭ **CaptureError**: ``"capture/invalid-photo-format"`` \| ``"capture/encoder-error"`` \| ``"capture/muxer-error"`` \| ``"capture/recording-in-progress"`` \| ``"capture/no-recording-in-progress"`` \| ``"capture/file-io-error"`` \| ``"capture/create-temp-file-error"`` \| ``"capture/invalid-video-options"`` \| ``"capture/create-recorder-error"`` \| ``"capture/recorder-error"`` \| ``"capture/no-valid-data"`` \| ``"capture/inactive-source"`` \| ``"capture/insufficient-storage"`` \| ``"capture/file-size-limit-reached"`` \| ``"capture/invalid-photo-codec"`` \| ``"capture/not-bound-error"`` \| ``"capture/capture-type-not-supported"`` \| ``"capture/video-not-enabled"`` \| ``"capture/photo-not-enabled"`` \| ``"capture/aborted"`` \| ``"capture/unknown"``

#### Defined in

[CameraError.ts:31](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraError.ts#L31)

___

### DeviceError

Ƭ **DeviceError**: ``"device/configuration-error"`` \| ``"device/no-device"`` \| ``"device/invalid-device"`` \| ``"device/torch-unavailable"`` \| ``"device/microphone-unavailable"`` \| ``"device/pixel-format-not-supported"`` \| ``"device/low-light-boost-not-supported"`` \| ``"device/focus-not-supported"`` \| ``"device/camera-not-available-on-simulator"``

#### Defined in

[CameraError.ts:8](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraError.ts#L8)

___

### FormatError

Ƭ **FormatError**: ``"format/invalid-fps"`` \| ``"format/invalid-hdr"`` \| ``"format/invalid-low-light-boost"`` \| ``"format/invalid-format"`` \| ``"format/invalid-color-space"``

#### Defined in

[CameraError.ts:18](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraError.ts#L18)

___

### FrameProcessor

Ƭ **FrameProcessor**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `frameProcessor` | (`frame`: `Frame`) => `void` |
| `type` | ``"frame-processor"`` |

#### Defined in

[CameraProps.ts:7](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraProps.ts#L7)

___

### LogicalCameraDeviceType

Ƭ **LogicalCameraDeviceType**: ``"dual-camera"`` \| ``"dual-wide-camera"`` \| ``"triple-camera"``

Indentifiers for a logical camera (Combinations of multiple physical cameras to create a single logical camera).

* `"dual-camera"`: A combination of wide-angle and telephoto cameras that creates a capture device.
* `"dual-wide-camera"`: A device that consists of two cameras of fixed focal length, one ultrawide angle and one wide angle.
* `"triple-camera"`: A device that consists of three cameras of fixed focal length, one ultrawide angle, one wide angle, and one telephoto.

#### Defined in

[CameraDevice.ts:21](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L21)

___

### ParameterError

Ƭ **ParameterError**: ``"parameter/invalid-parameter"`` \| ``"parameter/unsupported-os"`` \| ``"parameter/unsupported-output"`` \| ``"parameter/unsupported-input"`` \| ``"parameter/invalid-combination"``

#### Defined in

[CameraError.ts:2](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraError.ts#L2)

___

### PermissionError

Ƭ **PermissionError**: ``"permission/microphone-permission-denied"`` \| ``"permission/camera-permission-denied"``

#### Defined in

[CameraError.ts:1](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraError.ts#L1)

___

### PhysicalCameraDeviceType

Ƭ **PhysicalCameraDeviceType**: ``"ultra-wide-angle-camera"`` \| ``"wide-angle-camera"`` \| ``"telephoto-camera"``

Indentifiers for a physical camera (one that actually exists on the back/front of the device)

* `"ultra-wide-angle-camera"`: A built-in camera with a shorter focal length than that of a wide-angle camera. (focal length between below 24mm)
* `"wide-angle-camera"`: A built-in wide-angle camera. (focal length between 24mm and 35mm)
* `"telephoto-camera"`: A built-in camera device with a longer focal length than a wide-angle camera. (focal length between above 85mm)

#### Defined in

[CameraDevice.ts:12](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L12)

___

### SessionError

Ƭ **SessionError**: ``"session/camera-not-ready"`` \| ``"session/camera-cannot-be-opened"`` \| ``"session/camera-has-been-disconnected"`` \| ``"session/audio-session-setup-failed"`` \| ``"session/audio-in-use-by-other-app"`` \| ``"session/audio-session-failed-to-activate"``

#### Defined in

[CameraError.ts:24](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraError.ts#L24)

___

### SystemError

Ƭ **SystemError**: ``"system/camera-module-not-found"`` \| ``"system/no-camera-manager"`` \| ``"system/frame-processors-unavailable"`` \| ``"system/view-not-found"``

#### Defined in

[CameraError.ts:53](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraError.ts#L53)

___

### UnknownError

Ƭ **UnknownError**: ``"unknown/unknown"``

#### Defined in

[CameraError.ts:58](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraError.ts#L58)

___

### VideoStabilizationMode

Ƭ **VideoStabilizationMode**: ``"off"`` \| ``"standard"`` \| ``"cinematic"`` \| ``"cinematic-extended"`` \| ``"auto"``

Indicates a format's supported video stabilization mode. Enabling video stabilization may introduce additional latency into the video capture pipeline.

* `"off"`: No video stabilization. Indicates that video should not be stabilized
* `"standard"`: Standard software-based video stabilization. Standard video stabilization reduces the field of view by about 10%.
* `"cinematic"`: Advanced software-based video stabilization. This applies more aggressive cropping or transformations than standard.
* `"cinematic-extended"`: Extended software- and hardware-based stabilization that aggressively crops and transforms the video to apply a smooth cinematic stabilization.
* `"auto"`: Indicates that the most appropriate video stabilization mode for the device and format should be chosen automatically

#### Defined in

[CameraDevice.ts:64](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L64)

## Variables

### VisionCameraProxy

• `Const` **VisionCameraProxy**: `TVisionCameraProxy` = `proxy`

#### Defined in

[FrameProcessorPlugins.ts:95](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/FrameProcessorPlugins.ts#L95)

## Functions

### createFrameProcessor

▸ **createFrameProcessor**(`frameProcessor`, `type`): [`FrameProcessor`](#frameprocessor)

Create a new Frame Processor function which you can pass to the `<Camera>`.
(See ["Frame Processors"](https://mrousavy.github.io/react-native-vision-camera/docs/guides/frame-processors))

Make sure to add the `'worklet'` directive to the top of the Frame Processor function, otherwise it will not get compiled into a worklet.

Also make sure to memoize the returned object, so that the Camera doesn't reset the Frame Processor Context each time.

#### Parameters

| Name | Type |
| :------ | :------ |
| `frameProcessor` | (`frame`: `Frame`) => `void` |
| `type` | ``"frame-processor"`` |

#### Returns

[`FrameProcessor`](#frameprocessor)

#### Defined in

[hooks/useFrameProcessor.ts:13](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/hooks/useFrameProcessor.ts#L13)

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

[CameraError.ts:176](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraError.ts#L176)

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

[CameraDevice.ts:27](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L27)

___

### runAsync

▸ **runAsync**(`frame`, `func`): `void`

Runs the given function asynchronously, while keeping a strong reference to the Frame.

For example, if you want to run a heavy face detection algorithm
while still drawing to the screen at 60 FPS, you can use `runAsync(...)`
to offload the face detection algorithm to a separate thread.

**`Example`**

```ts
const frameProcessor = useFrameProcessor((frame) => {
  'worklet'
  console.log('New Frame')
  runAsync(frame, () => {
    'worklet'
    const faces = detectFaces(frame)
    const face = [faces0]
    console.log(`Detected a new face: ${face}`)
  })
})
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `frame` | `Frame` | The current Frame of the Frame Processor. |
| `func` | () => `void` | The function to execute. |

#### Returns

`void`

#### Defined in

[FrameProcessorPlugins.ts:177](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/FrameProcessorPlugins.ts#L177)

___

### runAtTargetFps

▸ **runAtTargetFps**<`T`\>(`fps`, `func`): `T` \| `undefined`

Runs the given function at the given target FPS rate.

For example, if you want to run a heavy face detection algorithm
only once per second, you can use `runAtTargetFps(1, ...)` to
throttle it to 1 FPS.

**`Example`**

```ts
const frameProcessor = useFrameProcessor((frame) => {
  'worklet'
  console.log('New Frame')
  runAtTargetFps(5, () => {
    'worklet'
    const faces = detectFaces(frame)
    console.log(`Detected a new face: ${faces[0]}`)
  })
})
```

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fps` | `number` | The target FPS rate at which the given function should be executed |
| `func` | () => `T` | The function to execute. |

#### Returns

`T` \| `undefined`

The result of the function if it was executed, or `undefined` otherwise.

#### Defined in

[FrameProcessorPlugins.ts:136](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/FrameProcessorPlugins.ts#L136)

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

[utils/FormatFilter.ts:18](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/utils/FormatFilter.ts#L18)

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

[utils/FormatFilter.ts:72](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/utils/FormatFilter.ts#L72)

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

[CameraError.ts:202](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraError.ts#L202)

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

[hooks/useCameraDevices.ts:29](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/hooks/useCameraDevices.ts#L29)

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

[hooks/useCameraDevices.ts:44](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/hooks/useCameraDevices.ts#L44)

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

[hooks/useCameraFormat.ts:14](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/hooks/useCameraFormat.ts#L14)

___

### useFrameProcessor

▸ **useFrameProcessor**(`frameProcessor`, `dependencies`): [`FrameProcessor`](#frameprocessor)

Returns a memoized Frame Processor function wich you can pass to the `<Camera>`.
(See ["Frame Processors"](https://mrousavy.github.io/react-native-vision-camera/docs/guides/frame-processors))

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
| `frameProcessor` | (`frame`: `Frame`) => `void` | The Frame Processor |
| `dependencies` | `DependencyList` | The React dependencies which will be copied into the VisionCamera JS-Runtime. |

#### Returns

[`FrameProcessor`](#frameprocessor)

The memoized Frame Processor.

#### Defined in

[hooks/useFrameProcessor.ts:49](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/hooks/useFrameProcessor.ts#L49)

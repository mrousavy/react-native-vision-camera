---
id: "CameraProps"
title: "CameraProps"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- `ViewProps`

  ↳ **`CameraProps`**

## Properties

### audio

• `Optional` **audio**: `boolean`

Enables **audio capture** for video recordings (see ["Recording Videos"](https://react-native-vision-camera.com/docs/guides/capturing/#recording-videos))

#### Defined in

[CameraProps.ts:56](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraProps.ts#L56)

___

### colorSpace

• `Optional` **colorSpace**: [`ColorSpace`](../#colorspace)

Specifies the color space to use for this camera device. Make sure the given `format` contains the given `colorSpace`.

Requires `format` to be set.

#### Defined in

[CameraProps.ts:122](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraProps.ts#L122)

___

### device

• **device**: [`CameraDevice`](CameraDevice.md)

The Camera Device to use.

See the [Camera Devices](https://react-native-vision-camera.com/docs/guides/devices) section in the documentation for more information about Camera Devices.

**`Example`**

```tsx
const devices = useCameraDevices('wide-angle-camera')
const device = devices.back

return (
  <Camera
    device={device}
    isActive={true}
    style={StyleSheet.absoluteFill}
  />
)
```

#### Defined in

[CameraProps.ts:32](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraProps.ts#L32)

___

### enableDepthData

• `Optional` **enableDepthData**: `boolean`

Also captures data from depth-perception sensors. (e.g. disparity maps)

**`Default`**

false

#### Defined in

[CameraProps.ts:137](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraProps.ts#L137)

___

### enableHighQualityPhotos

• `Optional` **enableHighQualityPhotos**: `boolean`

Indicates whether the Camera should prepare the photo pipeline to provide maximum quality photos.

This enables:
* High Resolution Capture ([`isHighResolutionCaptureEnabled`](https://developer.apple.com/documentation/avfoundation/avcapturephotooutput/1648721-ishighresolutioncaptureenabled))
* Virtual Device fusion for greater detail ([`isVirtualDeviceConstituentPhotoDeliveryEnabled`](https://developer.apple.com/documentation/avfoundation/avcapturephotooutput/3192189-isvirtualdeviceconstituentphotod))
* Dual Device fusion for greater detail ([`isDualCameraDualPhotoDeliveryEnabled`](https://developer.apple.com/documentation/avfoundation/avcapturephotosettings/2873917-isdualcameradualphotodeliveryena))
* Sets the maximum quality prioritization to `.quality` ([`maxPhotoQualityPrioritization`](https://developer.apple.com/documentation/avfoundation/avcapturephotooutput/3182995-maxphotoqualityprioritization))

**`Default`**

false

#### Defined in

[CameraProps.ts:158](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraProps.ts#L158)

___

### enablePortraitEffectsMatteDelivery

• `Optional` **enablePortraitEffectsMatteDelivery**: `boolean`

A boolean specifying whether the photo render pipeline is prepared for portrait effects matte delivery.

When enabling this, you must also set `enableDepthData` to `true`.

**`Platform`**

iOS 12.0+

**`Default`**

false

#### Defined in

[CameraProps.ts:146](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraProps.ts#L146)

___

### enableZoomGesture

• `Optional` **enableZoomGesture**: `boolean`

Enables or disables the native pinch to zoom gesture.

If you want to implement a custom zoom gesture, see [the Zooming with Reanimated documentation](https://react-native-vision-camera.com/docs/guides/animated).

**`Default`**

false

#### Defined in

[CameraProps.ts:87](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraProps.ts#L87)

___

### format

• `Optional` **format**: [`CameraDeviceFormat`](CameraDeviceFormat.md)

Selects a given format. Must be `undefined` when `preset` is set!

#### Defined in

[CameraProps.ts:98](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraProps.ts#L98)

___

### fps

• `Optional` **fps**: `number`

Specify the frames per second this camera should use. Make sure the given `format` includes a frame rate range with the given `fps`.

Requires `format` to be set.

#### Defined in

[CameraProps.ts:104](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraProps.ts#L104)

___

### frameProcessor

• `Optional` **frameProcessor**: (`frame`: [`Frame`](Frame.md)) => `void`

#### Type declaration

▸ (`frame`): `void`

A worklet which will be called for every frame the Camera "sees". Throttle the Frame Processor's frame rate with [`frameProcessorFps`](CameraProps.md#frameprocessorfps).

> See [the Frame Processors documentation](https://react-native-vision-camera.com/docs/guides/frame-processors) for more information

Note: If you want to use `video` and `frameProcessor` simultaneously, make sure [`supportsParallelVideoProcessing`](https://react-native-vision-camera.com/docs/guides/devices#the-supportsparallelvideoprocessing-prop) is `true`.

**`Example`**

```tsx
const frameProcessor = useFrameProcessor((frame) => {
  'worklet'
  const qrCodes = scanQRCodes(frame)
  console.log(`Detected QR Codes: ${qrCodes}`)
}, [])

return <Camera {...cameraProps} frameProcessor={frameProcessor} />
```

##### Parameters

| Name | Type |
| :------ | :------ |
| `frame` | [`Frame`](Frame.md) |

##### Returns

`void`

#### Defined in

[CameraProps.ts:195](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraProps.ts#L195)

___

### frameProcessorFps

• `Optional` **frameProcessorFps**: `number` \| ``"auto"``

Specifies the maximum frame rate the frame processor can use, independent of the Camera's frame rate (`fps` property).

* A value of `'auto'` (default) indicates that the frame processor should execute as fast as it can, without dropping frames. This is achieved by collecting historical data for previous frame processor calls and adjusting frame rate accordingly.
* A value of `1` indicates that the frame processor gets executed once per second, perfect for code scanning.
* A value of `10` indicates that the frame processor gets executed 10 times per second, perfect for more realtime use-cases.
* A value of `25` indicates that the frame processor gets executed 25 times per second, perfect for high-speed realtime use-cases.
* ...and so on

If you're using higher values, always check your Xcode/Android Studio Logs to make sure your frame processors are executing fast enough
without blocking the video recording queue.

**`Default`**

'auto'

#### Defined in

[CameraProps.ts:210](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraProps.ts#L210)

___

### hdr

• `Optional` **hdr**: `boolean`

Enables or disables HDR on this camera device. Make sure the given `format` supports HDR mode.

Requires `format` to be set.

#### Defined in

[CameraProps.ts:110](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraProps.ts#L110)

___

### isActive

• **isActive**: `boolean`

Whether the Camera should actively stream video frames, or not. See the [documentation about the `isActive` prop](https://react-native-vision-camera.com/docs/guides/lifecycle#the-isactive-prop) for more information.

This can be compared to a Video component, where `isActive` specifies whether the video is paused or not.

> Note: If you fully unmount the `<Camera>` component instead of using `isActive={false}`, the Camera will take a bit longer to start again. In return, it will use less resources since the Camera will be completely destroyed when unmounted.

#### Defined in

[CameraProps.ts:40](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraProps.ts#L40)

___

### lowLightBoost

• `Optional` **lowLightBoost**: `boolean`

Enables or disables low-light boost on this camera device. Make sure the given `format` supports low-light boost.

Requires `format` to be set.

#### Defined in

[CameraProps.ts:116](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraProps.ts#L116)

___

### onError

• `Optional` **onError**: (`error`: [`CameraRuntimeError`](../classes/CameraRuntimeError.md)) => `void`

#### Type declaration

▸ (`error`): `void`

Called when any kind of runtime error occured.

##### Parameters

| Name | Type |
| :------ | :------ |
| `error` | [`CameraRuntimeError`](../classes/CameraRuntimeError.md) |

##### Returns

`void`

#### Defined in

[CameraProps.ts:168](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraProps.ts#L168)

___

### onFrameProcessorPerformanceSuggestionAvailable

• `Optional` **onFrameProcessorPerformanceSuggestionAvailable**: (`suggestion`: [`FrameProcessorPerformanceSuggestion`](FrameProcessorPerformanceSuggestion.md)) => `void`

#### Type declaration

▸ (`suggestion`): `void`

Called when a new performance suggestion for a Frame Processor is available - either if your Frame Processor is running too fast and frames are being dropped, or because it is able to run faster. Optionally, you can adjust your `frameProcessorFps` accordingly.

##### Parameters

| Name | Type |
| :------ | :------ |
| `suggestion` | [`FrameProcessorPerformanceSuggestion`](FrameProcessorPerformanceSuggestion.md) |

##### Returns

`void`

#### Defined in

[CameraProps.ts:176](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraProps.ts#L176)

___

### onInitialized

• `Optional` **onInitialized**: () => `void`

#### Type declaration

▸ (): `void`

Called when the camera was successfully initialized.

##### Returns

`void`

#### Defined in

[CameraProps.ts:172](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraProps.ts#L172)

___

### orientation

• `Optional` **orientation**: ``"portrait"`` \| ``"portraitUpsideDown"`` \| ``"landscapeLeft"`` \| ``"landscapeRight"``

Represents the orientation of all Camera Outputs (Photo, Video, and Frame Processor). If this value is not set, the device orientation is used.

#### Defined in

[CameraProps.ts:162](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraProps.ts#L162)

___

### photo

• `Optional` **photo**: `boolean`

Enables **photo capture** with the `takePhoto` function (see ["Taking Photos"](https://react-native-vision-camera.com/docs/guides/capturing#taking-photos))

#### Defined in

[CameraProps.ts:46](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraProps.ts#L46)

___

### preset

• `Optional` **preset**: [`CameraPreset`](../#camerapreset)

Automatically selects a camera format which best matches the given preset. Must be `undefined` when `format` is set!

#### Defined in

[CameraProps.ts:94](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraProps.ts#L94)

___

### torch

• `Optional` **torch**: ``"off"`` \| ``"on"``

Set the current torch mode.

Note: The torch is only available on `"back"` cameras, and isn't supported by every phone.

**`Default`**

"off"

#### Defined in

[CameraProps.ts:67](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraProps.ts#L67)

___

### video

• `Optional` **video**: `boolean`

Enables **video capture** with the `startRecording` function (see ["Recording Videos"](https://react-native-vision-camera.com/docs/guides/capturing/#recording-videos))

Note: If you want to use `video` and `frameProcessor` simultaneously, make sure [`supportsParallelVideoProcessing`](https://react-native-vision-camera.com/docs/guides/devices#the-supportsparallelvideoprocessing-prop) is `true`.

#### Defined in

[CameraProps.ts:52](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraProps.ts#L52)

___

### videoStabilizationMode

• `Optional` **videoStabilizationMode**: [`VideoStabilizationMode`](../#videostabilizationmode)

Specifies the video stabilization mode to use for this camera device. Make sure the given `format` contains the given `videoStabilizationMode`.

Requires `format` to be set.

**`Platform`**

iOS

#### Defined in

[CameraProps.ts:129](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraProps.ts#L129)

___

### zoom

• `Optional` **zoom**: `number`

Specifies the zoom factor of the current camera, in "factor"/scale.

This value ranges from `minZoom` (e.g. `1`) to `maxZoom` (e.g. `128`). It is recommended to set this value
to the CameraDevice's `neutralZoom` per default and let the user zoom out to the fish-eye (ultra-wide) camera
on demand (if available)

**Note:** Linearly increasing this value always appears logarithmic to the user.

**`Default`**

1.0

#### Defined in

[CameraProps.ts:79](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraProps.ts#L79)

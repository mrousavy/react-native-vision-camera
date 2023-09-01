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

[CameraProps.ts:61](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraProps.ts#L61)

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

[CameraProps.ts:37](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraProps.ts#L37)

___

### enableDepthData

• `Optional` **enableDepthData**: `boolean`

Also captures data from depth-perception sensors. (e.g. disparity maps)

**`Default`**

false

#### Defined in

[CameraProps.ts:145](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraProps.ts#L145)

___

### enableFpsGraph

• `Optional` **enableFpsGraph**: `boolean`

If `true`, show a debug view to display the FPS of the Camera session.
This is useful for debugging your Frame Processor's speed.

**`Default`**

false

#### Defined in

[CameraProps.ts:173](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraProps.ts#L173)

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

[CameraProps.ts:166](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraProps.ts#L166)

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

[CameraProps.ts:154](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraProps.ts#L154)

___

### enableZoomGesture

• `Optional` **enableZoomGesture**: `boolean`

Enables or disables the native pinch to zoom gesture.

If you want to implement a custom zoom gesture, see [the Zooming with Reanimated documentation](https://react-native-vision-camera.com/docs/guides/animated).

**`Default`**

false

#### Defined in

[CameraProps.ts:106](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraProps.ts#L106)

___

### format

• `Optional` **format**: [`CameraDeviceFormat`](CameraDeviceFormat.md)

Selects a given format. By default, the best matching format is chosen.

#### Defined in

[CameraProps.ts:113](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraProps.ts#L113)

___

### fps

• `Optional` **fps**: `number`

Specify the frames per second this camera should use. Make sure the given `format` includes a frame rate range with the given `fps`.

Requires `format` to be set.

#### Defined in

[CameraProps.ts:119](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraProps.ts#L119)

___

### frameProcessor

• `Optional` **frameProcessor**: [`FrameProcessor`](../#frameprocessor)

A worklet which will be called for every frame the Camera "sees".

> See [the Frame Processors documentation](https://mrousavy.github.io/react-native-vision-camera/docs/guides/frame-processors) for more information

**`Example`**

```tsx
const frameProcessor = useFrameProcessor((frame) => {
  'worklet'
  const qrCodes = scanQRCodes(frame)
  console.log(`Detected QR Codes: ${qrCodes}`)
}, [])

return <Camera {...cameraProps} frameProcessor={frameProcessor} />
```

#### Defined in

[CameraProps.ts:204](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraProps.ts#L204)

___

### hdr

• `Optional` **hdr**: `boolean`

Enables or disables HDR on this camera device. Make sure the given `format` supports HDR mode.

Requires `format` to be set.

#### Defined in

[CameraProps.ts:125](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraProps.ts#L125)

___

### isActive

• **isActive**: `boolean`

Whether the Camera should actively stream video frames, or not. See the [documentation about the `isActive` prop](https://react-native-vision-camera.com/docs/guides/lifecycle#the-isactive-prop) for more information.

This can be compared to a Video component, where `isActive` specifies whether the video is paused or not.

> Note: If you fully unmount the `<Camera>` component instead of using `isActive={false}`, the Camera will take a bit longer to start again. In return, it will use less resources since the Camera will be completely destroyed when unmounted.

#### Defined in

[CameraProps.ts:45](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraProps.ts#L45)

___

### lowLightBoost

• `Optional` **lowLightBoost**: `boolean`

Enables or disables low-light boost on this camera device. Make sure the given `format` supports low-light boost.

Requires `format` to be set.

#### Defined in

[CameraProps.ts:131](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraProps.ts#L131)

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

[CameraProps.ts:183](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraProps.ts#L183)

___

### onInitialized

• `Optional` **onInitialized**: () => `void`

#### Type declaration

▸ (): `void`

Called when the camera was successfully initialized.

##### Returns

`void`

#### Defined in

[CameraProps.ts:187](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraProps.ts#L187)

___

### orientation

• `Optional` **orientation**: `Orientation`

Represents the orientation of all Camera Outputs (Photo, Video, and Frame Processor). If this value is not set, the device orientation is used.

#### Defined in

[CameraProps.ts:177](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraProps.ts#L177)

___

### photo

• `Optional` **photo**: `boolean`

Enables **photo capture** with the `takePhoto` function (see ["Taking Photos"](https://react-native-vision-camera.com/docs/guides/capturing#taking-photos))

#### Defined in

[CameraProps.ts:51](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraProps.ts#L51)

___

### pixelFormat

• `Optional` **pixelFormat**: ``"yuv"`` \| ``"rgb"`` \| ``"native"``

Specifies the pixel format for the video pipeline.

Frames from a [Frame Processor](https://mrousavy.github.io/react-native-vision-camera/docs/guides/frame-processors) will be streamed in the pixel format specified here.

While `native` and `yuv` are the most efficient formats, some ML models (such as MLKit Barcode detection) require input Frames to be in RGB colorspace, otherwise they just output nonsense.

- `native`: The hardware native GPU buffer format. This is the most efficient format. (`PRIVATE` on Android, sometimes YUV on iOS)
- `yuv`: The YUV (Y'CbCr 4:2:0 or NV21, 8-bit) format, either video- or full-range, depending on hardware capabilities. This is the second most efficient format.
- `rgb`: The RGB (RGB, RGBA or ABGRA, 8-bit) format. This is least efficient and requires explicit conversion.

**`Default`**

`native`

#### Defined in

[CameraProps.ts:75](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraProps.ts#L75)

___

### torch

• `Optional` **torch**: ``"off"`` \| ``"on"``

Set the current torch mode.

Note: The torch is only available on `"back"` cameras, and isn't supported by every phone.

**`Default`**

"off"

#### Defined in

[CameraProps.ts:86](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraProps.ts#L86)

___

### video

• `Optional` **video**: `boolean`

Enables **video capture** with the `startRecording` function (see ["Recording Videos"](https://react-native-vision-camera.com/docs/guides/capturing/#recording-videos))

Note: If both the `photo` and `video` properties are enabled at the same time and the device is running at a `hardwareLevel` of `'legacy'` or `'limited'`, VisionCamera _might_ use a lower resolution for video capture due to hardware constraints.

#### Defined in

[CameraProps.ts:57](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraProps.ts#L57)

___

### videoStabilizationMode

• `Optional` **videoStabilizationMode**: [`VideoStabilizationMode`](../#videostabilizationmode)

Specifies the video stabilization mode to use.

Requires a `format` to be set that contains the given `videoStabilizationMode`.

#### Defined in

[CameraProps.ts:137](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraProps.ts#L137)

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

[CameraProps.ts:98](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraProps.ts#L98)

---
id: "CameraDevice"
title: "CameraDevice"
sidebar_position: 0
custom_edit_url: null
---

Represents a camera device discovered by the [`Camera.getAvailableCameraDevices()`](../classes/Camera.md#getavailablecameradevices) function

## Properties

### devices

• **devices**: [`PhysicalCameraDeviceType`](../#physicalcameradevicetype)[]

The physical devices this `CameraDevice` contains.

* If this camera device is a **logical camera** (combination of multiple physical cameras), there are multiple cameras in this array.
* If this camera device is a **physical camera**, there is only a single element in this array.

You can check if the camera is a logical multi-camera by using the `isMultiCam` property.

#### Defined in

[CameraDevice.ts:199](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L199)

___

### formats

• **formats**: [`CameraDeviceFormat`](CameraDeviceFormat.md)[]

All available formats for this camera device. Use this to find the best format for your use case and set it to the Camera's [`Camera's .format`](CameraProps.md#format) property.

See [the Camera Formats documentation](https://react-native-vision-camera.com/docs/guides/formats) for more information about Camera Formats.

#### Defined in

[CameraDevice.ts:253](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L253)

___

### hasFlash

• **hasFlash**: `boolean`

Specifies whether this camera supports enabling flash for photo capture.

#### Defined in

[CameraDevice.ts:211](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L211)

___

### hasTorch

• **hasTorch**: `boolean`

Specifies whether this camera supports continuously enabling the flash to act like a torch (flash with video capture)

#### Defined in

[CameraDevice.ts:215](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L215)

___

### id

• **id**: `string`

The native ID of the camera device instance.

#### Defined in

[CameraDevice.ts:190](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L190)

___

### isMultiCam

• **isMultiCam**: `boolean`

A property indicating whether the device is a virtual multi-camera consisting of multiple combined physical cameras.

Examples:
* The Dual Camera, which supports seamlessly switching between a wide and telephoto camera while zooming and generating depth data from the disparities between the different points of view of the physical cameras.
* The TrueDepth Camera, which generates depth data from disparities between a YUV camera and an Infrared camera pointed in the same direction.

#### Defined in

[CameraDevice.ts:223](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L223)

___

### maxZoom

• **maxZoom**: `number`

Maximum available zoom factor (e.g. `128`)

#### Defined in

[CameraDevice.ts:231](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L231)

___

### minZoom

• **minZoom**: `number`

Minimum available zoom factor (e.g. `1`)

#### Defined in

[CameraDevice.ts:227](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L227)

___

### name

• **name**: `string`

A friendly localized name describing the camera.

#### Defined in

[CameraDevice.ts:207](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L207)

___

### neutralZoom

• **neutralZoom**: `number`

The zoom factor where the camera is "neutral".

* For single-physical cameras this property is always `1.0`.
* For multi cameras this property is a value between `minZoom` and `maxZoom`, where the camera is in _wide-angle_ mode and hasn't switched to the _ultra-wide-angle_ ("fish-eye") or telephoto camera yet.

Use this value as an initial value for the zoom property if you implement custom zoom. (e.g. reanimated shared value should be initially set to this value)

**`Example`**

```ts
const device = ...

const zoom = useSharedValue(device.neutralZoom) // <-- initial value so it doesn't start at ultra-wide
const cameraProps = useAnimatedProps(() => ({
  zoom: zoom.value
}))
```

#### Defined in

[CameraDevice.ts:247](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L247)

___

### position

• **position**: [`CameraPosition`](../#cameraposition)

Specifies the physical position of this camera. (back or front)

#### Defined in

[CameraDevice.ts:203](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L203)

___

### supportsDepthCapture

• **supportsDepthCapture**: `boolean`

Whether this camera supports taking photos with depth data.

**! Work in Progress !**

#### Defined in

[CameraDevice.ts:273](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L273)

___

### supportsFocus

• **supportsFocus**: `boolean`

Specifies whether this device supports focusing ([`Camera.focus(...)`](../classes/Camera.md#focus))

#### Defined in

[CameraDevice.ts:283](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L283)

___

### supportsLowLightBoost

• **supportsLowLightBoost**: `boolean`

Whether this camera device supports low light boost.

#### Defined in

[CameraDevice.ts:267](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L267)

___

### supportsParallelVideoProcessing

• **supportsParallelVideoProcessing**: `boolean`

Whether this camera device supports using Video Recordings (`video={true}`) and Frame Processors (`frameProcessor={...}`) at the same time. See ["The `supportsParallelVideoProcessing` prop"](https://react-native-vision-camera.com/docs/guides/devices#the-supportsparallelvideoprocessing-prop) for more information.

If this property is `false`, you can only enable `video` or add a `frameProcessor`, but not both.

* On iOS this value is always `true`.
* On newer Android devices this value is always `true`.
* On older Android devices this value is `false` if the Camera's hardware level is `LEGACY` or `LIMITED`, `true` otherwise. (See [`INFO_SUPPORTED_HARDWARE_LEVEL`](https://developer.android.com/reference/android/hardware/camera2/CameraCharacteristics#INFO_SUPPORTED_HARDWARE_LEVEL) or [the tables at "Regular capture"](https://developer.android.com/reference/android/hardware/camera2/CameraDevice#regular-capture))

#### Defined in

[CameraDevice.ts:263](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L263)

___

### supportsRawCapture

• **supportsRawCapture**: `boolean`

Whether this camera supports taking photos in RAW format

**! Work in Progress !**

#### Defined in

[CameraDevice.ts:279](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L279)

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

[CameraDevice.ts:149](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L149)

___

### formats

• **formats**: [`CameraDeviceFormat`](CameraDeviceFormat.md)[]

All available formats for this camera device. Use this to find the best format for your use case and set it to the Camera's [`Camera's .format`](CameraProps.md#format) property.

See [the Camera Formats documentation](https://react-native-vision-camera.com/docs/guides/formats) for more information about Camera Formats.

#### Defined in

[CameraDevice.ts:203](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L203)

___

### hardwareLevel

• **hardwareLevel**: ``"legacy"`` \| ``"limited"`` \| ``"full"``

The hardware level of the Camera.
- On Android, some older devices are running at a `legacy` or `limited` level which means they are running in a backwards compatible mode.
- On iOS, all devices are `full`.

#### Defined in

[CameraDevice.ts:229](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L229)

___

### hasFlash

• **hasFlash**: `boolean`

Specifies whether this camera supports enabling flash for photo capture.

#### Defined in

[CameraDevice.ts:161](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L161)

___

### hasTorch

• **hasTorch**: `boolean`

Specifies whether this camera supports continuously enabling the flash to act like a torch (flash with video capture)

#### Defined in

[CameraDevice.ts:165](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L165)

___

### id

• **id**: `string`

The native ID of the camera device instance.

#### Defined in

[CameraDevice.ts:140](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L140)

___

### isMultiCam

• **isMultiCam**: `boolean`

A property indicating whether the device is a virtual multi-camera consisting of multiple combined physical cameras.

Examples:
* The Dual Camera, which supports seamlessly switching between a wide and telephoto camera while zooming and generating depth data from the disparities between the different points of view of the physical cameras.
* The TrueDepth Camera, which generates depth data from disparities between a YUV camera and an Infrared camera pointed in the same direction.

#### Defined in

[CameraDevice.ts:173](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L173)

___

### maxZoom

• **maxZoom**: `number`

Maximum available zoom factor (e.g. `128`)

#### Defined in

[CameraDevice.ts:181](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L181)

___

### minZoom

• **minZoom**: `number`

Minimum available zoom factor (e.g. `1`)

#### Defined in

[CameraDevice.ts:177](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L177)

___

### name

• **name**: `string`

A friendly localized name describing the camera.

#### Defined in

[CameraDevice.ts:157](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L157)

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

[CameraDevice.ts:197](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L197)

___

### position

• **position**: [`CameraPosition`](../#cameraposition)

Specifies the physical position of this camera. (back or front)

#### Defined in

[CameraDevice.ts:153](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L153)

___

### sensorOrientation

• **sensorOrientation**: `Orientation`

Represents the sensor's orientation relative to the phone.
For most phones this will be landscape, as Camera sensors are usually always rotated by 90 degrees (i.e. width and height are flipped).

#### Defined in

[CameraDevice.ts:234](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L234)

___

### supportsDepthCapture

• **supportsDepthCapture**: `boolean`

Whether this camera supports taking photos with depth data.

**! Work in Progress !**

#### Defined in

[CameraDevice.ts:213](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L213)

___

### supportsFocus

• **supportsFocus**: `boolean`

Specifies whether this device supports focusing ([`Camera.focus(...)`](../classes/Camera.md#focus))

#### Defined in

[CameraDevice.ts:223](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L223)

___

### supportsLowLightBoost

• **supportsLowLightBoost**: `boolean`

Whether this camera device supports low light boost.

#### Defined in

[CameraDevice.ts:207](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L207)

___

### supportsRawCapture

• **supportsRawCapture**: `boolean`

Whether this camera supports taking photos in RAW format

**! Work in Progress !**

#### Defined in

[CameraDevice.ts:219](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L219)

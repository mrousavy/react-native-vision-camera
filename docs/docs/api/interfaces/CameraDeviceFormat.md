---
id: "CameraDeviceFormat"
title: "CameraDeviceFormat"
sidebar_position: 0
custom_edit_url: null
---

A Camera Device's video format. Do not create instances of this type yourself, only use [`Camera.getAvailableCameraDevices()`](../classes/Camera.md#getavailablecameradevices).

## Properties

### autoFocusSystem

• **autoFocusSystem**: [`AutoFocusSystem`](../#autofocussystem)

Specifies this format's auto focus system.

#### Defined in

[CameraDevice.ts:121](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L121)

___

### fieldOfView

• **fieldOfView**: `number`

The video field of view in degrees

#### Defined in

[CameraDevice.ts:97](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L97)

___

### maxFps

• **maxFps**: `number`

The maximum frame rate this Format is able to run at. High resolution formats often run at lower frame rates.

#### Defined in

[CameraDevice.ts:117](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L117)

___

### maxISO

• **maxISO**: `number`

Maximum supported ISO value

#### Defined in

[CameraDevice.ts:89](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L89)

___

### maxZoom

• **maxZoom**: `number`

The maximum zoom factor (e.g. `128`)

#### Defined in

[CameraDevice.ts:101](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L101)

___

### minFps

• **minFps**: `number`

The minum frame rate this Format needs to run at. High resolution formats often run at lower frame rates.

#### Defined in

[CameraDevice.ts:113](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L113)

___

### minISO

• **minISO**: `number`

Minimum supported ISO value

#### Defined in

[CameraDevice.ts:93](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L93)

___

### photoHeight

• **photoHeight**: `number`

The height of the highest resolution a still image (photo) can be produced in

#### Defined in

[CameraDevice.ts:73](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L73)

___

### photoWidth

• **photoWidth**: `number`

The width of the highest resolution a still image (photo) can be produced in

#### Defined in

[CameraDevice.ts:77](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L77)

___

### pixelFormats

• **pixelFormats**: `PixelFormat`[]

Specifies this format's supported pixel-formats.
In most cases, this is `['native', 'yuv']`.

#### Defined in

[CameraDevice.ts:130](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L130)

___

### supportsPhotoHDR

• **supportsPhotoHDR**: `boolean`

Specifies whether this format supports HDR mode for photo capture

#### Defined in

[CameraDevice.ts:109](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L109)

___

### supportsVideoHDR

• **supportsVideoHDR**: `boolean`

Specifies whether this format supports HDR mode for video capture

#### Defined in

[CameraDevice.ts:105](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L105)

___

### videoHeight

• **videoHeight**: `number`

The video resolutions's height

#### Defined in

[CameraDevice.ts:81](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L81)

___

### videoStabilizationModes

• **videoStabilizationModes**: [`VideoStabilizationMode`](../#videostabilizationmode)[]

All supported video stabilization modes

#### Defined in

[CameraDevice.ts:125](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L125)

___

### videoWidth

• **videoWidth**: `number`

The video resolution's width

#### Defined in

[CameraDevice.ts:85](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraDevice.ts#L85)

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

[CameraDevice.ts:170](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L170)

___

### colorSpaces

• **colorSpaces**: [`ColorSpace`](../#colorspace)[]

The available color spaces.

Note: On Android, this will always be only `["yuv"]`

#### Defined in

[CameraDevice.ts:154](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L154)

___

### fieldOfView

• **fieldOfView**: `number`

The video field of view in degrees

#### Defined in

[CameraDevice.ts:144](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L144)

___

### frameRateRanges

• **frameRateRanges**: [`FrameRateRange`](FrameRateRange.md)[]

All available frame rate ranges. You can query this to find the highest frame rate available

#### Defined in

[CameraDevice.ts:166](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L166)

___

### isHighestPhotoQualitySupported

• `Optional` **isHighestPhotoQualitySupported**: `boolean`

A boolean value specifying whether this format supports the highest possible photo quality that can be delivered on the current platform.

**`Platform`**

iOS 13.0+

#### Defined in

[CameraDevice.ts:132](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L132)

___

### maxISO

• **maxISO**: `number`

Maximum supported ISO value

#### Defined in

[CameraDevice.ts:136](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L136)

___

### maxZoom

• **maxZoom**: `number`

The maximum zoom factor (e.g. `128`)

#### Defined in

[CameraDevice.ts:148](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L148)

___

### minISO

• **minISO**: `number`

Minimum supported ISO value

#### Defined in

[CameraDevice.ts:140](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L140)

___

### photoHeight

• **photoHeight**: `number`

The height of the highest resolution a still image (photo) can be produced in

#### Defined in

[CameraDevice.ts:114](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L114)

___

### photoWidth

• **photoWidth**: `number`

The width of the highest resolution a still image (photo) can be produced in

#### Defined in

[CameraDevice.ts:118](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L118)

___

### pixelFormat

• **pixelFormat**: `PixelFormat`

Specifies this format's pixel format. The pixel format specifies how the individual pixels are interpreted as a visual image.

The most common format is `420v`. Some formats (like `x420`) are not compatible with some frame processor plugins (e.g. MLKit)

#### Defined in

[CameraDevice.ts:180](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L180)

___

### supportsPhotoHDR

• **supportsPhotoHDR**: `boolean`

Specifies whether this format supports HDR mode for photo capture

#### Defined in

[CameraDevice.ts:162](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L162)

___

### supportsVideoHDR

• **supportsVideoHDR**: `boolean`

Specifies whether this format supports HDR mode for video capture

#### Defined in

[CameraDevice.ts:158](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L158)

___

### videoHeight

• **videoHeight**: `number`

The video resolutions's height

#### Defined in

[CameraDevice.ts:122](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L122)

___

### videoStabilizationModes

• **videoStabilizationModes**: [`VideoStabilizationMode`](../#videostabilizationmode)[]

All supported video stabilization modes

#### Defined in

[CameraDevice.ts:174](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L174)

___

### videoWidth

• **videoWidth**: `number`

The video resolution's width

#### Defined in

[CameraDevice.ts:126](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraDevice.ts#L126)

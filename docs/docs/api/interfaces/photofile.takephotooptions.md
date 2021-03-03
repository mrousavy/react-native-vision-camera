---
id: "photofile.takephotooptions"
title: "Interface: TakePhotoOptions"
sidebar_label: "PhotoFile.TakePhotoOptions"
custom_edit_url: null
hide_title: true
---

# Interface: TakePhotoOptions

[PhotoFile](../modules/photofile.md).TakePhotoOptions

## Properties

### enableAutoDistortionCorrection

• `Optional` **enableAutoDistortionCorrection**: *undefined* \| *boolean*

Specifies whether the photo output should use content aware distortion correction on this photo request (at its discretion).

**`default`** false

Defined in: [src/PhotoFile.ts:52](https://github.com/cuvent/react-native-vision-camera/blob/c314255/src/PhotoFile.ts#L52)

___

### enableAutoRedEyeReduction

• `Optional` **enableAutoRedEyeReduction**: *undefined* \| *boolean*

Specifies whether red-eye reduction should be applied automatically on flash captures.

**`default`** false

Defined in: [src/PhotoFile.ts:33](https://github.com/cuvent/react-native-vision-camera/blob/c314255/src/PhotoFile.ts#L33)

___

### enableAutoStabilization

• `Optional` **enableAutoStabilization**: *undefined* \| *boolean*

Indicates whether still image stabilization will be employed when capturing the photo

**`default`** false

Defined in: [src/PhotoFile.ts:46](https://github.com/cuvent/react-native-vision-camera/blob/c314255/src/PhotoFile.ts#L46)

___

### enableVirtualDeviceFusion

• `Optional` **enableVirtualDeviceFusion**: *undefined* \| *boolean*

Specifies whether a virtual multi-cam device should capture images from all containing physical cameras
to create a combined, higher quality image.

**`see`** [`isAutoVirtualDeviceFusionEnabled`](https://developer.apple.com/documentation/avfoundation/avcapturephotosettings/3192192-isautovirtualdevicefusionenabled)

Defined in: [src/PhotoFile.ts:40](https://github.com/cuvent/react-native-vision-camera/blob/c314255/src/PhotoFile.ts#L40)

___

### flash

• `Optional` **flash**: *undefined* \| *off* \| *auto* \| *on*

Whether the Flash should be enabled or disabled

**`default`** "auto"

Defined in: [src/PhotoFile.ts:27](https://github.com/cuvent/react-native-vision-camera/blob/c314255/src/PhotoFile.ts#L27)

___

### photoCodec

• `Optional` **photoCodec**: *undefined* \| *hevc* \| *hevc-alpha* \| *jpeg*

Specify the photo codec to use. To get a list of available photo codecs use the `getAvailablePhotoCodecs()` function.

**`default`** undefined

Defined in: [src/PhotoFile.ts:10](https://github.com/cuvent/react-native-vision-camera/blob/c314255/src/PhotoFile.ts#L10)

___

### qualityPrioritization

• `Optional` **qualityPrioritization**: *undefined* \| *quality* \| *balanced* \| *speed*

Indicates how photo quality should be prioritized against speed.

* `"quality"` Indicates that speed of photo delivery is most important, even at the expense of quality
* `"balanced"` Indicates that photo quality and speed of delivery are balanced in priority
* `"speed"` Indicates that photo quality is paramount, even at the expense of shot-to-shot time

**`platform`** iOS 13.0+

**`default`** "balanced"

Defined in: [src/PhotoFile.ts:21](https://github.com/cuvent/react-native-vision-camera/blob/c314255/src/PhotoFile.ts#L21)

___

### skipMetadata

• `Optional` **skipMetadata**: *undefined* \| *boolean*

When set to `true`, metadata reading and mapping will be skipped. (`PhotoFile.metadata` will be null)

This might result in a faster capture, as metadata reading and mapping requires File IO.

**`default`** false

**`platform`** Android

Defined in: [src/PhotoFile.ts:62](https://github.com/cuvent/react-native-vision-camera/blob/c314255/src/PhotoFile.ts#L62)

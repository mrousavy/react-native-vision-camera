---
id: "TakePhotoOptions"
title: "TakePhotoOptions"
sidebar_position: 0
custom_edit_url: null
---

## Properties

### enableAutoDistortionCorrection

• `Optional` **enableAutoDistortionCorrection**: `boolean`

Specifies whether the photo output should use content aware distortion correction on this photo request.
For example, the algorithm may not apply correction to faces in the center of a photo, but may apply it to faces near the photo’s edges.

**`Platform`**

iOS

**`Default`**

false

#### Defined in

[PhotoFile.ts:40](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/PhotoFile.ts#L40)

___

### enableAutoRedEyeReduction

• `Optional` **enableAutoRedEyeReduction**: `boolean`

Specifies whether red-eye reduction should be applied automatically on flash captures.

**`Default`**

false

#### Defined in

[PhotoFile.ts:26](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/PhotoFile.ts#L26)

___

### enableAutoStabilization

• `Optional` **enableAutoStabilization**: `boolean`

Indicates whether still image stabilization will be employed when capturing the photo

**`Default`**

false

#### Defined in

[PhotoFile.ts:32](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/PhotoFile.ts#L32)

___

### enableShutterSound

• `Optional` **enableShutterSound**: `boolean`

Whether to play the default shutter "click" sound when taking a picture or not.

**`Default`**

true

#### Defined in

[PhotoFile.ts:46](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/PhotoFile.ts#L46)

___

### flash

• `Optional` **flash**: ``"off"`` \| ``"auto"`` \| ``"on"``

Whether the Flash should be enabled or disabled

**`Default`**

"auto"

#### Defined in

[PhotoFile.ts:20](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/PhotoFile.ts#L20)

___

### qualityPrioritization

• `Optional` **qualityPrioritization**: ``"quality"`` \| ``"balanced"`` \| ``"speed"``

Indicates how photo quality should be prioritized against speed.

* `"quality"` Indicates that photo quality is paramount, even at the expense of shot-to-shot time
* `"balanced"` Indicates that photo quality and speed of delivery are balanced in priority
* `"speed"` Indicates that speed of photo delivery is most important, even at the expense of quality

**`Default`**

"balanced"

#### Defined in

[PhotoFile.ts:14](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/PhotoFile.ts#L14)

---
id: "PhotoFile"
title: "PhotoFile"
sidebar_position: 0
custom_edit_url: null
---

Represents a Photo taken by the Camera written to the local filesystem.

See [`Camera.takePhoto()`](../classes/Camera.md#takephoto)

## Hierarchy

- [`TemporaryFile`](TemporaryFile.md)

  ↳ **`PhotoFile`**

## Properties

### height

• **height**: `number`

The height of the photo, in pixels.

#### Defined in

[PhotoFile.ts:62](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/PhotoFile.ts#L62)

___

### isMirrored

• **isMirrored**: `boolean`

Whether this photo is mirrored (selfies) or not.

#### Defined in

[PhotoFile.ts:76](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/PhotoFile.ts#L76)

___

### isRawPhoto

• **isRawPhoto**: `boolean`

Whether this photo is in RAW format or not.

#### Defined in

[PhotoFile.ts:66](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/PhotoFile.ts#L66)

___

### metadata

• `Optional` **metadata**: `Object`

Metadata information describing the captured image. (iOS only)

**`See`**

[AVCapturePhoto.metadata](https://developer.apple.com/documentation/avfoundation/avcapturephoto/2873982-metadata)

**`Platform`**

iOS

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `DPIHeight` | `number` | **`Platform`** iOS |
| `DPIWidth` | `number` | **`Platform`** iOS |
| `Orientation` | `number` | Orientation of the EXIF Image. * 1 = 0 degrees: the correct orientation, no adjustment is required. * 2 = 0 degrees, mirrored: image has been flipped back-to-front. * 3 = 180 degrees: image is upside down. * 4 = 180 degrees, mirrored: image has been flipped back-to-front and is upside down. * 5 = 90 degrees: image has been flipped back-to-front and is on its side. * 6 = 90 degrees, mirrored: image is on its side. * 7 = 270 degrees: image has been flipped back-to-front and is on its far side. * 8 = 270 degrees, mirrored: image is on its far side. |
| `{Exif}` | { `ApertureValue`: `number` ; `BrightnessValue`: `number` ; `ColorSpace`: `number` ; `DateTimeDigitized`: `string` ; `DateTimeOriginal`: `string` ; `ExifVersion`: `string` ; `ExposureBiasValue`: `number` ; `ExposureMode`: `number` ; `ExposureProgram`: `number` ; `ExposureTime`: `number` ; `FNumber`: `number` ; `Flash`: `number` ; `FocalLenIn35mmFilm`: `number` ; `FocalLength`: `number` ; `ISOSpeedRatings`: `number`[] ; `LensMake`: `string` ; `LensModel`: `string` ; `LensSpecification`: `number`[] ; `MeteringMode`: `number` ; `OffsetTime`: `string` ; `OffsetTimeDigitized`: `string` ; `OffsetTimeOriginal`: `string` ; `PixelXDimension`: `number` ; `PixelYDimension`: `number` ; `SceneType`: `number` ; `SensingMethod`: `number` ; `ShutterSpeedValue`: `number` ; `SubjectArea`: `number`[] ; `SubsecTimeDigitized`: `string` ; `SubsecTimeOriginal`: `string` ; `WhiteBalance`: `number`  } | - |
| `{Exif}.ApertureValue` | `number` | - |
| `{Exif}.BrightnessValue` | `number` | - |
| `{Exif}.ColorSpace` | `number` | - |
| `{Exif}.DateTimeDigitized` | `string` | - |
| `{Exif}.DateTimeOriginal` | `string` | - |
| `{Exif}.ExifVersion` | `string` | - |
| `{Exif}.ExposureBiasValue` | `number` | - |
| `{Exif}.ExposureMode` | `number` | - |
| `{Exif}.ExposureProgram` | `number` | - |
| `{Exif}.ExposureTime` | `number` | - |
| `{Exif}.FNumber` | `number` | - |
| `{Exif}.Flash` | `number` | - |
| `{Exif}.FocalLenIn35mmFilm` | `number` | - |
| `{Exif}.FocalLength` | `number` | - |
| `{Exif}.ISOSpeedRatings` | `number`[] | - |
| `{Exif}.LensMake` | `string` | - |
| `{Exif}.LensModel` | `string` | - |
| `{Exif}.LensSpecification` | `number`[] | - |
| `{Exif}.MeteringMode` | `number` | - |
| `{Exif}.OffsetTime` | `string` | - |
| `{Exif}.OffsetTimeDigitized` | `string` | - |
| `{Exif}.OffsetTimeOriginal` | `string` | - |
| `{Exif}.PixelXDimension` | `number` | - |
| `{Exif}.PixelYDimension` | `number` | - |
| `{Exif}.SceneType` | `number` | - |
| `{Exif}.SensingMethod` | `number` | - |
| `{Exif}.ShutterSpeedValue` | `number` | - |
| `{Exif}.SubjectArea` | `number`[] | - |
| `{Exif}.SubsecTimeDigitized` | `string` | - |
| `{Exif}.SubsecTimeOriginal` | `string` | - |
| `{Exif}.WhiteBalance` | `number` | - |
| `{MakerApple}?` | `Record`<`string`, `unknown`\> | Represents any data Apple cameras write to the metadata **`Platform`** iOS |
| `{TIFF}` | { `DateTime`: `string` ; `HostComputer?`: `string` ; `Make`: `string` ; `Model`: `string` ; `ResolutionUnit`: `number` ; `Software`: `string` ; `XResolution`: `number` ; `YResolution`: `number`  } | - |
| `{TIFF}.DateTime` | `string` | - |
| `{TIFF}.HostComputer?` | `string` | **`Platform`** iOS |
| `{TIFF}.Make` | `string` | - |
| `{TIFF}.Model` | `string` | - |
| `{TIFF}.ResolutionUnit` | `number` | - |
| `{TIFF}.Software` | `string` | - |
| `{TIFF}.XResolution` | `number` | - |
| `{TIFF}.YResolution` | `number` | - |

#### Defined in

[PhotoFile.ts:85](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/PhotoFile.ts#L85)

___

### orientation

• **orientation**: `Orientation`

Display orientation of the photo, relative to the Camera's sensor orientation.

Note that Camera sensors are landscape, so e.g. "portrait" photos will have a value of "landscape-left", etc.

#### Defined in

[PhotoFile.ts:72](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/PhotoFile.ts#L72)

___

### path

• **path**: `string`

The path of the file.

* **Note:** If you want to consume this file (e.g. for displaying it in an `<Image>` component), you might have to add the `file://` prefix.

* **Note:** This file might get deleted once the app closes because it lives in the temp directory.

#### Inherited from

[TemporaryFile](TemporaryFile.md).[path](TemporaryFile.md#path)

#### Defined in

[TemporaryFile.ts:12](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/TemporaryFile.ts#L12)

___

### thumbnail

• `Optional` **thumbnail**: `Record`<`string`, `unknown`\>

#### Defined in

[PhotoFile.ts:77](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/PhotoFile.ts#L77)

___

### width

• **width**: `number`

The width of the photo, in pixels.

#### Defined in

[PhotoFile.ts:58](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/PhotoFile.ts#L58)

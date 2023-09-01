---
id: "PhotoFile"
title: "PhotoFile"
sidebar_position: 0
custom_edit_url: null
---

Represents a Photo taken by the Camera written to the local filesystem.

Related: [`Camera.takePhoto()`](../classes/Camera.md#takephoto), [`Camera.takeSnapshot()`](../classes/Camera.md#takesnapshot)

## Hierarchy

- [`TemporaryFile`](TemporaryFile.md)

  ↳ **`PhotoFile`**

## Properties

### height

• **height**: `number`

#### Defined in

[PhotoFile.ts:58](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/PhotoFile.ts#L58)

___

### isRawPhoto

• **isRawPhoto**: `boolean`

#### Defined in

[PhotoFile.ts:59](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/PhotoFile.ts#L59)

___

### metadata

• **metadata**: `Object`

Metadata information describing the captured image.

**`See`**

 - [AVCapturePhoto.metadata](https://developer.apple.com/documentation/avfoundation/avcapturephoto/2873982-metadata)
 - [AndroidX ExifInterface](https://developer.android.com/reference/androidx/exifinterface/media/ExifInterface)

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `DPIHeight` | `number` | **`Platform`** iOS |
| `DPIWidth` | `number` | **`Platform`** iOS |
| `Orientation` | `number` | - |
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

[PhotoFile.ts:67](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/PhotoFile.ts#L67)

___

### path

• **path**: `string`

The path of the file.

* **Note:** If you want to consume this file (e.g. for displaying it in an `<Image>` component), you might have to add the `file://` prefix.

* **Note:** This file might get deleted once the app closes because it lives in the temp directory.

#### Inherited from

[TemporaryFile](TemporaryFile.md).[path](TemporaryFile.md#path)

#### Defined in

[TemporaryFile.ts:12](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/TemporaryFile.ts#L12)

___

### thumbnail

• `Optional` **thumbnail**: `Record`<`string`, `unknown`\>

#### Defined in

[PhotoFile.ts:60](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/PhotoFile.ts#L60)

___

### width

• **width**: `number`

#### Defined in

[PhotoFile.ts:57](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/PhotoFile.ts#L57)

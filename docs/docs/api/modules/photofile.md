---
id: "photofile"
title: "Module: PhotoFile"
sidebar_label: "PhotoFile"
custom_edit_url: null
hide_title: true
---

# Module: PhotoFile

## Table of contents

### Interfaces

- [TakePhotoOptions](../interfaces/photofile.takephotooptions.md)

## Type aliases

### PhotoFile

Ƭ **PhotoFile**: *Readonly*<[*TemporaryFile*](temporaryfile.md#temporaryfile) & { `height`: *number* ; `isRawPhoto`: *boolean* ; `metadata`: { `DPIHeight`: *number* ; `DPIWidth`: *number* ; `Orientation`: *number* ; `{Exif}`: { `ApertureValue`: *number* ; `BrightnessValue`: *number* ; `ColorSpace`: *number* ; `DateTimeDigitized`: *string* ; `DateTimeOriginal`: *string* ; `ExifVersion`: *string* ; `ExposureBiasValue`: *number* ; `ExposureMode`: *number* ; `ExposureProgram`: *number* ; `ExposureTime`: *number* ; `FNumber`: *number* ; `Flash`: *number* ; `FocalLenIn35mmFilm`: *number* ; `FocalLength`: *number* ; `ISOSpeedRatings`: *number*[] ; `LensMake`: *string* ; `LensModel`: *string* ; `LensSpecification`: *number*[] ; `MeteringMode`: *number* ; `OffsetTime`: *string* ; `OffsetTimeDigitized`: *string* ; `OffsetTimeOriginal`: *string* ; `PixelXDimension`: *number* ; `PixelYDimension`: *number* ; `SceneType`: *number* ; `SensingMethod`: *number* ; `ShutterSpeedValue`: *number* ; `SubjectArea`: *number*[] ; `SubsecTimeDigitized`: *string* ; `SubsecTimeOriginal`: *string* ; `WhiteBalance`: *number*  } ; `{MakerApple}?`: *Record*<string, unknown\> ; `{TIFF}`: { `DateTime`: *string* ; `HostComputer?`: *string* ; `Make`: *string* ; `Model`: *string* ; `ResolutionUnit`: *number* ; `Software`: *string* ; `XResolution`: *number* ; `YResolution`: *number*  }  } ; `thumbnail?`: *Record*<string, unknown\> ; `width`: *number*  }\>

Represents a Photo taken by the Camera written to the local filesystem.

Defined in: [src/PhotoFile.ts:68](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/PhotoFile.ts#L68)

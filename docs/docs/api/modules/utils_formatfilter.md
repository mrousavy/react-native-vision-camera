---
id: "utils_formatfilter"
title: "Module: utils/FormatFilter"
sidebar_label: "utils/FormatFilter"
custom_edit_url: null
hide_title: true
---

# Module: utils/FormatFilter

## Type aliases

### Size

Ƭ **Size**: *object*

Represents a Size in any unit.

#### Type declaration:

Name | Type | Description |
:------ | :------ | :------ |
`height` | *number* | Points in height.   |
`width` | *number* | Points in width.   |

Defined in: [src/utils/FormatFilter.ts:36](https://github.com/cuvent/react-native-vision-camera/blob/c314255/src/utils/FormatFilter.ts#L36)

## Functions

### filterFormatsByAspectRatio

▸ `Const`**filterFormatsByAspectRatio**(`formats`: *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\>[], `viewSize?`: [*Size*](utils_formatfilter.md#size)): *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\>[]

Filters Camera Device Formats by the best matching aspect ratio for the given `viewSize`.

**`example`** 
```js
const formats = useMemo(() => filterFormatsByAspectRatio(device.formats, CAMERA_VIEW_SIZE), [device.formats])
```

**`method`** 

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`formats` | *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\>[] | A list of formats the current device has (see {@link CameraDevice.formats})   |
`viewSize` | [*Size*](utils_formatfilter.md#size) | The size of the camera view which will be used to find the best aspect ratio. Defaults to the screen size.   |

**Returns:** *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\>[]

A list of Camera Device Formats that match the given `viewSize`' aspect ratio _as close as possible_.

Defined in: [src/utils/FormatFilter.ts:92](https://github.com/cuvent/react-native-vision-camera/blob/c314255/src/utils/FormatFilter.ts#L92)

___

### frameRateIncluded

▸ `Const`**frameRateIncluded**(`range`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>, `fps`: *number*): *boolean*

Returns `true` if the given Frame Rate Range (`range`) contains the given frame rate (`fps`)

**`example`** 
```js
// get all formats that support 60 FPS
const formatsWithHighFps = useMemo(() => device.formats.filter((f) => f.frameRateRanges.some((r) => frameRateIncluded(r, 60))), [device.formats])
```

**`method`** 

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`range` | *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\> | The range to check if the given `fps` are included in   |
`fps` | *number* | The FPS to check if the given `range` supports.   |

**Returns:** *boolean*

Defined in: [src/utils/FormatFilter.ts:137](https://github.com/cuvent/react-native-vision-camera/blob/c314255/src/utils/FormatFilter.ts#L137)

___

### sortDevices

▸ `Const`**sortDevices**(`left`: *Readonly*<{ `devices`: [*PhysicalCameraDeviceType*](cameradevice.md#physicalcameradevicetype)[] ; `formats`: *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\>[] ; `hasFlash`: *boolean* ; `hasTorch`: *boolean* ; `id`: *string* ; `isMultiCam`: *boolean* ; `maxZoom`: *number* ; `minZoom`: *number* ; `name`: *string* ; `neutralZoom`: *number* ; `position`: [*CameraPosition*](cameraposition.md#cameraposition) ; `supportsLowLightBoost`: *boolean*  }\>, `right`: *Readonly*<{ `devices`: [*PhysicalCameraDeviceType*](cameradevice.md#physicalcameradevicetype)[] ; `formats`: *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\>[] ; `hasFlash`: *boolean* ; `hasTorch`: *boolean* ; `id`: *string* ; `isMultiCam`: *boolean* ; `maxZoom`: *number* ; `minZoom`: *number* ; `name`: *string* ; `neutralZoom`: *number* ; `position`: [*CameraPosition*](cameraposition.md#cameraposition) ; `supportsLowLightBoost`: *boolean*  }\>): *number*

Compares two devices by the following criteria:
* `wide-angle-camera`s are ranked higher than others
* Devices with more physical cameras are ranked higher than ones with less. (e.g. "Triple Camera" > "Wide-Angle Camera")

> Note that this makes the `sort()` function descending, so the first element (`[0]`) is the "best" device.

**`example`** 
```js
const devices = camera.devices.sort(sortDevices)
const bestDevice = devices[0]
```

**`method`** 

#### Parameters:

Name | Type |
:------ | :------ |
`left` | *Readonly*<{ `devices`: [*PhysicalCameraDeviceType*](cameradevice.md#physicalcameradevicetype)[] ; `formats`: *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\>[] ; `hasFlash`: *boolean* ; `hasTorch`: *boolean* ; `id`: *string* ; `isMultiCam`: *boolean* ; `maxZoom`: *number* ; `minZoom`: *number* ; `name`: *string* ; `neutralZoom`: *number* ; `position`: [*CameraPosition*](cameraposition.md#cameraposition) ; `supportsLowLightBoost`: *boolean*  }\> |
`right` | *Readonly*<{ `devices`: [*PhysicalCameraDeviceType*](cameradevice.md#physicalcameradevicetype)[] ; `formats`: *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\>[] ; `hasFlash`: *boolean* ; `hasTorch`: *boolean* ; `id`: *string* ; `isMultiCam`: *boolean* ; `maxZoom`: *number* ; `minZoom`: *number* ; `name`: *string* ; `neutralZoom`: *number* ; `position`: [*CameraPosition*](cameraposition.md#cameraposition) ; `supportsLowLightBoost`: *boolean*  }\> |

**Returns:** *number*

Defined in: [src/utils/FormatFilter.ts:18](https://github.com/cuvent/react-native-vision-camera/blob/c314255/src/utils/FormatFilter.ts#L18)

___

### sortFormatsByResolution

▸ `Const`**sortFormatsByResolution**(`left`: *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\>, `right`: *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\>): *number*

Sorts Camera Device Formats by highest photo-capture resolution, descending. Use this in a `.sort` function.

**`example`** 
```js
const formats = useMemo(() => device.formats.sort(sortFormatsByResolution), [device.formats])
const bestFormat = formats[0]
```

**`method`** 

#### Parameters:

Name | Type |
:------ | :------ |
`left` | *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> |
`right` | *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> |

**Returns:** *number*

Defined in: [src/utils/FormatFilter.ts:112](https://github.com/cuvent/react-native-vision-camera/blob/c314255/src/utils/FormatFilter.ts#L112)

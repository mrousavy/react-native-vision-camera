---
id: "hooks_usecameraformat"
title: "Module: hooks/useCameraFormat"
sidebar_label: "hooks/useCameraFormat"
custom_edit_url: null
hide_title: true
---

# Module: hooks/useCameraFormat

## Functions

### useCameraFormat

▸ **useCameraFormat**(`device?`: [*CameraDevice*](cameradevice.md#cameradevice), `cameraViewSize?`: [*Size*](utils_formatfilter.md#size)): [*CameraDeviceFormat*](cameradevice.md#cameradeviceformat) \| *undefined*

Returns the best format for the given camera device.

This function tries to choose a format with the highest possible photo-capture resolution and best matching aspect ratio.

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`device?` | [*CameraDevice*](cameradevice.md#cameradevice) | The Camera Device   |
`cameraViewSize?` | [*Size*](utils_formatfilter.md#size) | The Camera View's size. This can be an approximation and **must be memoized**! Default: `SCREEN_SIZE`    |

**Returns:** [*CameraDeviceFormat*](cameradevice.md#cameradeviceformat) \| *undefined*

The best matching format for the given camera device, or `undefined` if the camera device is `undefined`.

Defined in: [src/hooks/useCameraFormat.ts:16](https://github.com/cuvent/react-native-vision-camera/blob/c314255/src/hooks/useCameraFormat.ts#L16)

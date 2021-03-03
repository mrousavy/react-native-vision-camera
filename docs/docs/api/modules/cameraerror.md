---
id: "cameraerror"
title: "Module: CameraError"
sidebar_label: "CameraError"
custom_edit_url: null
hide_title: true
---

# Module: CameraError

## Table of contents

### Classes

- [CameraCaptureError](../classes/cameraerror.cameracaptureerror.md)
- [CameraRuntimeError](../classes/cameraerror.cameraruntimeerror.md)

### Interfaces

- [ErrorWithCause](../interfaces/cameraerror.errorwithcause.md)

## Type aliases

### CaptureError

Ƭ **CaptureError**: *capture/invalid-photo-format* \| *capture/encoder-error* \| *capture/muxer-error* \| *capture/recording-in-progress* \| *capture/no-recording-in-progress* \| *capture/file-io-error* \| *capture/create-temp-file-error* \| *capture/invalid-photo-codec* \| *capture/not-bound-error* \| *capture/capture-type-not-supported* \| *capture/unknown*

Defined in: [src/CameraError.ts:24](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraError.ts#L24)

___

### DeviceError

Ƭ **DeviceError**: *device/configuration-error* \| *device/no-device* \| *device/invalid-device* \| *device/torch-unavailable* \| *device/microphone-unavailable* \| *device/low-light-boost-not-supported* \| *device/focus-not-supported* \| *device/camera-not-available-on-simulator*

Defined in: [src/CameraError.ts:8](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraError.ts#L8)

___

### FormatError

Ƭ **FormatError**: *format/invalid-fps* \| *format/invalid-hdr* \| *format/invalid-low-light-boost* \| *format/invalid-format* \| *format/invalid-preset*

Defined in: [src/CameraError.ts:17](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraError.ts#L17)

___

### ParameterError

Ƭ **ParameterError**: *parameter/invalid-parameter* \| *parameter/unsupported-os* \| *parameter/unsupported-output* \| *parameter/unsupported-input* \| *parameter/invalid-combination*

Defined in: [src/CameraError.ts:2](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraError.ts#L2)

___

### PermissionError

Ƭ **PermissionError**: *permission/microphone-permission-denied* \| *permission/camera-permission-denied*

Defined in: [src/CameraError.ts:1](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraError.ts#L1)

___

### SessionError

Ƭ **SessionError**: *session/camera-not-ready* \| *session/audio-session-setup-failed*

Defined in: [src/CameraError.ts:23](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraError.ts#L23)

___

### SystemError

Ƭ **SystemError**: *system/no-camera-manager*

Defined in: [src/CameraError.ts:36](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraError.ts#L36)

___

### UnknownError

Ƭ **UnknownError**: *unknown/unknown*

Defined in: [src/CameraError.ts:37](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraError.ts#L37)

## Functions

### isErrorWithCause

▸ `Const`**isErrorWithCause**(`error`: *unknown*): error is ErrorWithCause

#### Parameters:

Name | Type |
:------ | :------ |
`error` | *unknown* |

**Returns:** error is ErrorWithCause

Defined in: [src/CameraError.ts:127](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraError.ts#L127)

___

### tryParseNativeCameraError

▸ `Const`**tryParseNativeCameraError**<T\>(`nativeError`: T): [*CameraRuntimeError*](../classes/cameraerror.cameraruntimeerror.md) \| [*CameraCaptureError*](../classes/cameraerror.cameracaptureerror.md) \| T

Tries to parse an error coming from native to a typed JS camera error.

**`method`** 

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`nativeError` | T | The native error instance. This is a JSON in the legacy native module architecture.   |

**Returns:** [*CameraRuntimeError*](../classes/cameraerror.cameraruntimeerror.md) \| [*CameraCaptureError*](../classes/cameraerror.cameracaptureerror.md) \| T

A `CameraRuntimeError` or `CameraCaptureError`, or the nativeError if it's not parsable

Defined in: [src/CameraError.ts:153](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraError.ts#L153)

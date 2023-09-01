---
id: "CameraRuntimeError"
title: "CameraRuntimeError"
sidebar_position: 0
custom_edit_url: null
---

Represents any kind of error that occured in the Camera View Module.

See the ["Camera Errors" documentation](https://react-native-vision-camera.com/docs/guides/errors) for more information about Camera Errors.

## Hierarchy

- `CameraError`<[`PermissionError`](../#permissionerror) \| [`ParameterError`](../#parametererror) \| [`DeviceError`](../#deviceerror) \| [`FormatError`](../#formaterror) \| [`FrameProcessorError`](../#frameprocessorerror) \| [`SessionError`](../#sessionerror) \| [`SystemError`](../#systemerror) \| [`UnknownError`](../#unknownerror)\>

  ↳ **`CameraRuntimeError`**

## Accessors

### cause

• `get` **cause**(): `undefined` \| `Error`

#### Returns

`undefined` \| `Error`

#### Inherited from

CameraError.cause

#### Defined in

[CameraError.ts:129](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraError.ts#L129)

___

### code

• `get` **code**(): `TCode`

#### Returns

`TCode`

#### Inherited from

CameraError.code

#### Defined in

[CameraError.ts:123](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraError.ts#L123)

___

### message

• `get` **message**(): `string`

#### Returns

`string`

#### Inherited from

CameraError.message

#### Defined in

[CameraError.ts:126](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraError.ts#L126)

## Methods

### toString

▸ **toString**(): `string`

#### Returns

`string`

#### Inherited from

CameraError.toString

#### Defined in

[CameraError.ts:147](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/CameraError.ts#L147)

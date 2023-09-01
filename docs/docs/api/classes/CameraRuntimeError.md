---
id: "CameraRuntimeError"
title: "CameraRuntimeError"
sidebar_position: 0
custom_edit_url: null
---

Represents any kind of error that occured in the Camera View Module.

See the ["Camera Errors" documentation](https://react-native-vision-camera.com/docs/guides/errors) for more information about Camera Errors.

## Hierarchy

- `CameraError`<[`PermissionError`](../#permissionerror) \| [`ParameterError`](../#parametererror) \| [`DeviceError`](../#deviceerror) \| [`FormatError`](../#formaterror) \| [`SessionError`](../#sessionerror) \| [`SystemError`](../#systemerror) \| [`UnknownError`](../#unknownerror)\>

  ↳ **`CameraRuntimeError`**

## Accessors

### cause

• `get` **cause**(): `undefined` \| `Error`

#### Returns

`undefined` \| `Error`

#### Inherited from

CameraError.cause

#### Defined in

[CameraError.ts:132](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraError.ts#L132)

___

### code

• `get` **code**(): `TCode`

#### Returns

`TCode`

#### Inherited from

CameraError.code

#### Defined in

[CameraError.ts:126](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraError.ts#L126)

___

### message

• `get` **message**(): `string`

#### Returns

`string`

#### Inherited from

CameraError.message

#### Defined in

[CameraError.ts:129](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraError.ts#L129)

## Methods

### toString

▸ **toString**(): `string`

#### Returns

`string`

#### Inherited from

CameraError.toString

#### Defined in

[CameraError.ts:150](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraError.ts#L150)

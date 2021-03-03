---
id: "cameraerror.cameraruntimeerror"
title: "Class: CameraRuntimeError"
sidebar_label: "CameraError.CameraRuntimeError"
custom_edit_url: null
hide_title: true
---

# Class: CameraRuntimeError

[CameraError](../modules/cameraerror.md).CameraRuntimeError

Represents any kind of error that occured in the Camera View Module.

## Hierarchy

* *CameraError*<[*PermissionError*](../modules/cameraerror.md#permissionerror) \| [*ParameterError*](../modules/cameraerror.md#parametererror) \| [*DeviceError*](../modules/cameraerror.md#deviceerror) \| [*FormatError*](../modules/cameraerror.md#formaterror) \| [*SessionError*](../modules/cameraerror.md#sessionerror) \| [*SystemError*](../modules/cameraerror.md#systemerror) \| [*UnknownError*](../modules/cameraerror.md#unknownerror)\>

  ↳ **CameraRuntimeError**

## Constructors

### constructor

\+ **new CameraRuntimeError**(`code`: *permission/microphone-permission-denied* \| *permission/camera-permission-denied* \| *parameter/invalid-parameter* \| *parameter/unsupported-os* \| *parameter/unsupported-output* \| *parameter/unsupported-input* \| *parameter/invalid-combination* \| *device/configuration-error* \| *device/no-device* \| *device/invalid-device* \| *device/torch-unavailable* \| *device/microphone-unavailable* \| *device/low-light-boost-not-supported* \| *device/focus-not-supported* \| *device/camera-not-available-on-simulator* \| *format/invalid-fps* \| *format/invalid-hdr* \| *format/invalid-low-light-boost* \| *format/invalid-format* \| *format/invalid-preset* \| *session/camera-not-ready* \| *session/audio-session-setup-failed* \| *system/no-camera-manager* \| *unknown/unknown*, `message`: *string*, `cause?`: [*ErrorWithCause*](../interfaces/cameraerror.errorwithcause.md)): [*CameraRuntimeError*](cameraerror.cameraruntimeerror.md)

#### Parameters:

Name | Type |
:------ | :------ |
`code` | *permission/microphone-permission-denied* \| *permission/camera-permission-denied* \| *parameter/invalid-parameter* \| *parameter/unsupported-os* \| *parameter/unsupported-output* \| *parameter/unsupported-input* \| *parameter/invalid-combination* \| *device/configuration-error* \| *device/no-device* \| *device/invalid-device* \| *device/torch-unavailable* \| *device/microphone-unavailable* \| *device/low-light-boost-not-supported* \| *device/focus-not-supported* \| *device/camera-not-available-on-simulator* \| *format/invalid-fps* \| *format/invalid-hdr* \| *format/invalid-low-light-boost* \| *format/invalid-format* \| *format/invalid-preset* \| *session/camera-not-ready* \| *session/audio-session-setup-failed* \| *system/no-camera-manager* \| *unknown/unknown* |
`message` | *string* |
`cause?` | [*ErrorWithCause*](../interfaces/cameraerror.errorwithcause.md) |

**Returns:** [*CameraRuntimeError*](cameraerror.cameraruntimeerror.md)

Defined in: [src/CameraError.ts:105](https://github.com/cuvent/react-native-vision-camera/blob/c314255/src/CameraError.ts#L105)

## Properties

### name

• **name**: *string*

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:973

___

### prepareStackTrace

• `Optional` **prepareStackTrace**: *undefined* \| (`err`: Error, `stackTraces`: CallSite[]) => *any*

Optional override for formatting stack traces

**`see`** https://github.com/v8/v8/wiki/Stack%20Trace%20API#customizing-stack-traces

Defined in: node_modules/@types/node/globals.d.ts:11

___

### stack

• `Optional` **stack**: *undefined* \| *string*

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:975

___

### stackTraceLimit

• **stackTraceLimit**: *number*

Defined in: node_modules/@types/node/globals.d.ts:13

## Accessors

### cause

• get **cause**(): *undefined* \| [*ErrorWithCause*](../interfaces/cameraerror.errorwithcause.md)

**Returns:** *undefined* \| [*ErrorWithCause*](../interfaces/cameraerror.errorwithcause.md)

Defined in: [src/CameraError.ts:103](https://github.com/cuvent/react-native-vision-camera/blob/c314255/src/CameraError.ts#L103)

___

### code

• get **code**(): TCode

**Returns:** TCode

Defined in: [src/CameraError.ts:97](https://github.com/cuvent/react-native-vision-camera/blob/c314255/src/CameraError.ts#L97)

___

### message

• get **message**(): *string*

**Returns:** *string*

Defined in: [src/CameraError.ts:100](https://github.com/cuvent/react-native-vision-camera/blob/c314255/src/CameraError.ts#L100)

## Methods

### captureStackTrace

▸ **captureStackTrace**(`targetObject`: *object*, `constructorOpt?`: Function): *void*

Create .stack property on a target object

#### Parameters:

Name | Type |
:------ | :------ |
`targetObject` | *object* |
`constructorOpt?` | Function |

**Returns:** *void*

Defined in: node_modules/@types/node/globals.d.ts:4

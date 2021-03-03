---
id: "cameraerror.cameracaptureerror"
title: "Class: CameraCaptureError"
sidebar_label: "CameraError.CameraCaptureError"
custom_edit_url: null
hide_title: true
---

# Class: CameraCaptureError

[CameraError](../modules/cameraerror.md).CameraCaptureError

Represents any kind of error that occured while trying to capture a video or photo.

## Hierarchy

* *CameraError*<[*CaptureError*](../modules/cameraerror.md#captureerror)\>

  ↳ **CameraCaptureError**

## Constructors

### constructor

\+ **new CameraCaptureError**(`code`: [*CaptureError*](../modules/cameraerror.md#captureerror), `message`: *string*, `cause?`: [*ErrorWithCause*](../interfaces/cameraerror.errorwithcause.md)): [*CameraCaptureError*](cameraerror.cameracaptureerror.md)

#### Parameters:

Name | Type |
:------ | :------ |
`code` | [*CaptureError*](../modules/cameraerror.md#captureerror) |
`message` | *string* |
`cause?` | [*ErrorWithCause*](../interfaces/cameraerror.errorwithcause.md) |

**Returns:** [*CameraCaptureError*](cameraerror.cameracaptureerror.md)

Defined in: [src/CameraError.ts:105](https://github.com/cuvent/react-native-vision-camera/blob/c314255/src/CameraError.ts#L105)

## Properties

### name

• **name**: *string*

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:973

___

### stack

• `Optional` **stack**: *undefined* \| *string*

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:975

___

### prepareStackTrace

▪ `Optional` `Static` **prepareStackTrace**: *undefined* \| (`err`: Error, `stackTraces`: CallSite[]) => *any*

Optional override for formatting stack traces

**`see`** https://github.com/v8/v8/wiki/Stack%20Trace%20API#customizing-stack-traces

Defined in: node_modules/@types/node/globals.d.ts:11

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: *number*

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

▸ `Static`**captureStackTrace**(`targetObject`: *object*, `constructorOpt?`: Function): *void*

Create .stack property on a target object

#### Parameters:

Name | Type |
:------ | :------ |
`targetObject` | *object* |
`constructorOpt?` | Function |

**Returns:** *void*

Defined in: node_modules/@types/node/globals.d.ts:4

---
id: "ErrorWithCause"
title: "ErrorWithCause"
sidebar_position: 0
custom_edit_url: null
---

Represents a JSON-style error cause. This contains native `NSError`/`Throwable` information, and can have recursive [`.cause`](ErrorWithCause.md#cause) properties until the ultimate cause has been found.

## Properties

### cause

• `Optional` **cause**: [`ErrorWithCause`](ErrorWithCause.md)

Optional additional cause for nested errors

* iOS: N/A
* Android: `Throwable.cause`

#### Defined in

[CameraError.ts:105](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraError.ts#L105)

___

### code

• `Optional` **code**: `number`

The native error's code.

* iOS: `NSError.code`
* Android: N/A

#### Defined in

[CameraError.ts:70](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraError.ts#L70)

___

### details

• `Optional` **details**: `Record`<`string`, `unknown`\>

Optional additional details

* iOS: `NSError.userInfo`
* Android: N/A

#### Defined in

[CameraError.ts:91](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraError.ts#L91)

___

### domain

• `Optional` **domain**: `string`

The native error's domain.

* iOS: `NSError.domain`
* Android: N/A

#### Defined in

[CameraError.ts:77](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraError.ts#L77)

___

### message

• **message**: `string`

The native error description

* iOS: `NSError.message`
* Android: `Throwable.message`

#### Defined in

[CameraError.ts:84](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraError.ts#L84)

___

### stacktrace

• `Optional` **stacktrace**: `string`

Optional Java stacktrace

* iOS: N/A
* Android: `Throwable.stacktrace.toString()`

#### Defined in

[CameraError.ts:98](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/CameraError.ts#L98)

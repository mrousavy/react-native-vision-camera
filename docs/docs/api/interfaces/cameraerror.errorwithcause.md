---
id: "cameraerror.errorwithcause"
title: "Interface: ErrorWithCause"
sidebar_label: "CameraError.ErrorWithCause"
custom_edit_url: null
hide_title: true
---

# Interface: ErrorWithCause

[CameraError](../modules/cameraerror.md).ErrorWithCause

Represents a JSON-style error cause. This contains native `NSError`/`Throwable` information, and can have recursive `.cause` properties until the ultimate cause has been found.

## Properties

### cause

• `Optional` **cause**: *undefined* \| [*ErrorWithCause*](cameraerror.errorwithcause.md)

Optional additional cause for nested errors

* iOS: N/A
* Android: `Throwable.cause`

Defined in: [src/CameraError.ts:84](https://github.com/cuvent/react-native-vision-camera/blob/daa3c48/src/CameraError.ts#L84)

___

### code

• `Optional` **code**: *undefined* \| *number*

The native error's code.

* iOS: `NSError.code`
* Android: N/A

Defined in: [src/CameraError.ts:49](https://github.com/cuvent/react-native-vision-camera/blob/daa3c48/src/CameraError.ts#L49)

___

### details

• `Optional` **details**: *undefined* \| *Record*<string, unknown\>

Optional additional details

* iOS: `NSError.userInfo`
* Android: N/A

Defined in: [src/CameraError.ts:70](https://github.com/cuvent/react-native-vision-camera/blob/daa3c48/src/CameraError.ts#L70)

___

### domain

• `Optional` **domain**: *undefined* \| *string*

The native error's domain.

* iOS: `NSError.domain`
* Android: N/A

Defined in: [src/CameraError.ts:56](https://github.com/cuvent/react-native-vision-camera/blob/daa3c48/src/CameraError.ts#L56)

___

### message

• **message**: *string*

The native error description (Localized on iOS)

* iOS: `NSError.message`
* Android: `Throwable.message`

Defined in: [src/CameraError.ts:63](https://github.com/cuvent/react-native-vision-camera/blob/daa3c48/src/CameraError.ts#L63)

___

### stacktrace

• `Optional` **stacktrace**: *undefined* \| *string*

Optional stacktrace

* iOS: N/A
* Android: `Throwable.stacktrace.toString()`

Defined in: [src/CameraError.ts:77](https://github.com/cuvent/react-native-vision-camera/blob/daa3c48/src/CameraError.ts#L77)

---
id: "cameraposition"
title: "Module: CameraPosition"
sidebar_label: "CameraPosition"
custom_edit_url: null
hide_title: true
---

# Module: CameraPosition

## Type aliases

### CameraPosition

Ƭ **CameraPosition**: *front* \| *back* \| *unspecified* \| *external*

Represents the camera device position.

* `"back"`: Indicates that the device is physically located on the back of the system hardware
* `"front"`: Indicates that the device is physically located on the front of the system hardware

#### iOS only
* `"unspecified"`: Indicates that the device's position relative to the system hardware is unspecified

#### Android only
* `"external"`: The camera device is an external camera, and has no fixed facing relative to the device's screen. (Android only)

Defined in: [src/CameraPosition.ts:13](https://github.com/cuvent/react-native-vision-camera/blob/daa3c48/src/CameraPosition.ts#L13)

---
id: "camera"
title: "Module: Camera"
sidebar_label: "Camera"
custom_edit_url: null
hide_title: true
---

# Module: Camera

## Table of contents

### Classes

- [Camera](../classes/camera.camera-1.md)

## Type aliases

### CameraDeviceProps

Ƭ **CameraDeviceProps**: *object*

#### Type declaration:

Name | Type | Description |
:------ | :------ | :------ |
`device` | [*CameraDevice*](cameradevice.md#cameradevice) | The Camera Device to use   |
`enableDepthData`? | *boolean* | Also captures data from depth-perception sensors. (e.g. disparity maps)  **`default`** false  |
`enableHighResolutionCapture`? | *boolean* | Indicates whether the photo render pipeline should be configured to deliver high resolution still images  **`default`** false  |
`enablePortraitEffectsMatteDelivery`? | *boolean* | A boolean specifying whether the photo render pipeline is prepared for portrait effects matte delivery.  When enabling this, you must also set `enableDepthData` to `true`.   **`platform`** iOS 12.0+  **`default`** false  |

Defined in: [src/Camera.tsx:73](https://github.com/cuvent/react-native-vision-camera/blob/daa3c48/src/Camera.tsx#L73)

___

### CameraDynamicProps

Ƭ **CameraDynamicProps**: *object*

#### Type declaration:

Name | Type | Description |
:------ | :------ | :------ |
`enableZoomGesture`? | *boolean* | Enables or disables the pinch to zoom gesture  **`default`** false  |
`isActive` | *boolean* | Whether the Camera should actively stream video frames, or not.  This can be compared to a Video component, where `isActive` specifies whether the video is paused or not.  > Note: If you fully unmount the `<Camera>` component instead of using `isActive={false}`, the Camera will take a bit longer to start again. In return, it will use less resources since the Camera will be completely destroyed when unmounted.    |
`torch`? | *off* \| *on* | Set the current torch mode.  Note: The torch is only available on `"back"` cameras, and isn't supported by every phone.   **`default`** "off"  |
`zoom`? | *number* | Specifies the zoom factor of the current camera, in percent. (`0.0` - `1.0`)  **`default`** 0.0  |

Defined in: [src/Camera.tsx:102](https://github.com/cuvent/react-native-vision-camera/blob/daa3c48/src/Camera.tsx#L102)

___

### CameraEventProps

Ƭ **CameraEventProps**: *object*

#### Type declaration:

Name | Type | Description |
:------ | :------ | :------ |
`onError`? | (`error`: [*CameraRuntimeError*](../classes/cameraerror.cameraruntimeerror.md)) => *void* | Called when any kind of runtime error occured.   |
`onInitialized`? | () => *void* | Called when the camera was successfully initialized.   |

Defined in: [src/Camera.tsx:133](https://github.com/cuvent/react-native-vision-camera/blob/daa3c48/src/Camera.tsx#L133)

___

### CameraPermissionRequestResult

Ƭ **CameraPermissionRequestResult**: *authorized* \| *denied*

Defined in: [src/Camera.tsx:152](https://github.com/cuvent/react-native-vision-camera/blob/daa3c48/src/Camera.tsx#L152)

___

### CameraPermissionStatus

Ƭ **CameraPermissionStatus**: *authorized* \| *not-determined* \| *denied* \| *restricted*

Defined in: [src/Camera.tsx:151](https://github.com/cuvent/react-native-vision-camera/blob/daa3c48/src/Camera.tsx#L151)

___

### CameraProps

Ƭ **CameraProps**: CameraPresetProps \| CameraFormatProps & CameraScannerPropsNever \| [*CameraScannerProps*](camera.md#camerascannerprops) & [*CameraDeviceProps*](camera.md#cameradeviceprops) & [*CameraDynamicProps*](camera.md#cameradynamicprops) & [*CameraEventProps*](camera.md#cameraeventprops) & ViewProps

Defined in: [src/Camera.tsx:144](https://github.com/cuvent/react-native-vision-camera/blob/daa3c48/src/Camera.tsx#L144)

___

### CameraScannerProps

Ƭ **CameraScannerProps**: *Modify*<CameraScannerPropsNever, { `onCodeScanned`: (`codes`: [*Code*](code.md#code)[]) => *void* ; `scannableCodes`: [*CodeType*](code.md#codetype)[]  }\>

Defined in: [src/Camera.tsx:65](https://github.com/cuvent/react-native-vision-camera/blob/daa3c48/src/Camera.tsx#L65)

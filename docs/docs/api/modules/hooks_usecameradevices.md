---
id: "hooks_usecameradevices"
title: "Module: hooks/useCameraDevices"
sidebar_label: "hooks/useCameraDevices"
custom_edit_url: null
hide_title: true
---

# Module: hooks/useCameraDevices

## Functions

### useCameraDevices

▸ **useCameraDevices**(): CameraDevices

Gets the best available `CameraDevice`. Devices with more cameras are preferred.

**`throws`** `CameraRuntimeError` if no device was found.

**`example`** 
```jsx
const device = useCameraDevice()
// ...
return <Camera device={device} />
```

**Returns:** CameraDevices

The best matching `CameraDevice`.

Defined in: [src/hooks/useCameraDevices.ts:29](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/hooks/useCameraDevices.ts#L29)

▸ **useCameraDevices**(`deviceType`: [*PhysicalCameraDeviceType*](cameradevice.md#physicalcameradevicetype) \| [*LogicalCameraDeviceType*](cameradevice.md#logicalcameradevicetype)): CameraDevices

Gets a `CameraDevice` for the requested device type.

**`throws`** `CameraRuntimeError` if no device was found.

**`example`** 
```jsx
const device = useCameraDevice('wide-angle-camera')
// ...
return <Camera device={device} />
```

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`deviceType` | [*PhysicalCameraDeviceType*](cameradevice.md#physicalcameradevicetype) \| [*LogicalCameraDeviceType*](cameradevice.md#logicalcameradevicetype) | Specifies a device type which will be used as a device filter.   |

**Returns:** CameraDevices

A `CameraDevice` for the requested device type.

Defined in: [src/hooks/useCameraDevices.ts:44](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/hooks/useCameraDevices.ts#L44)

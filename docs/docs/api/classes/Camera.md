---
id: "Camera"
title: "Camera"
sidebar_position: 0
custom_edit_url: null
---

### A powerful `<Camera>` component.

Read the [VisionCamera documentation](https://react-native-vision-camera.com/) for more information.

The `<Camera>` component's most important (and therefore _required_) properties are:

* [`device`](../interfaces/CameraProps.md#device): Specifies the [`CameraDevice`](../interfaces/CameraDevice.md) to use. Get a [`CameraDevice`](../interfaces/CameraDevice.md) by using the [`useCameraDevices()`](../#usecameradevices) hook, or manually by using the [`Camera.getAvailableCameraDevices()`](Camera.md#getavailablecameradevices) function.
* [`isActive`](../interfaces/CameraProps.md#isactive): A boolean value that specifies whether the Camera should actively stream video frames or not. This can be compared to a Video component, where `isActive` specifies whether the video is paused or not. If you fully unmount the `<Camera>` component instead of using `isActive={false}`, the Camera will take a bit longer to start again.

**`Example`**

```tsx
function App() {
  const devices = useCameraDevices('wide-angle-camera')
  const device = devices.back

  if (device == null) return <LoadingView />
  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={true}
    />
  )
}
```

**`Component`**

## Hierarchy

- `PureComponent`<[`CameraProps`](../interfaces/CameraProps.md)\>

  ↳ **`Camera`**

## Methods

### focus

▸ **focus**(`point`): `Promise`<`void`\>

Focus the camera to a specific point in the coordinate system.

**`Throws`**

[`CameraRuntimeError`](CameraRuntimeError.md) When any kind of error occured while focussing. Use the [`code`](CameraRuntimeError.md#code) property to get the actual error

**`Example`**

```ts
await camera.current.focus({
  x: tapEvent.x,
  y: tapEvent.y
})
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `point` | [`Point`](../interfaces/Point.md) | The point to focus to. This should be relative to the Camera view's coordinate system, and expressed in Pixel on iOS and Points on Android. * `(0, 0)` means **top left**. * `(CameraView.width, CameraView.height)` means **bottom right**. Make sure the value doesn't exceed the CameraView's dimensions. |

#### Returns

`Promise`<`void`\>

#### Defined in

[Camera.tsx:250](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/Camera.tsx#L250)

___

### pauseRecording

▸ **pauseRecording**(): `Promise`<`void`\>

Pauses the current video recording.

**`Throws`**

[`CameraCaptureError`](CameraCaptureError.md) When any kind of error occured while pausing the video recording. Use the [`code`](CameraCaptureError.md#code) property to get the actual error

**`Example`**

```ts
// Start
await camera.current.startRecording()
await timeout(1000)
// Pause
await camera.current.pauseRecording()
await timeout(500)
// Resume
await camera.current.resumeRecording()
await timeout(2000)
// Stop
const video = await camera.current.stopRecording()
```

#### Returns

`Promise`<`void`\>

#### Defined in

[Camera.tsx:175](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/Camera.tsx#L175)

___

### resumeRecording

▸ **resumeRecording**(): `Promise`<`void`\>

Resumes a currently paused video recording.

**`Throws`**

[`CameraCaptureError`](CameraCaptureError.md) When any kind of error occured while resuming the video recording. Use the [`code`](CameraCaptureError.md#code) property to get the actual error

**`Example`**

```ts
// Start
await camera.current.startRecording()
await timeout(1000)
// Pause
await camera.current.pauseRecording()
await timeout(500)
// Resume
await camera.current.resumeRecording()
await timeout(2000)
// Stop
const video = await camera.current.stopRecording()
```

#### Returns

`Promise`<`void`\>

#### Defined in

[Camera.tsx:203](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/Camera.tsx#L203)

___

### startRecording

▸ **startRecording**(`options`): `void`

Start a new video recording.

Records in the following formats:
* **iOS**: QuickTime (`.mov`)
* **Android**: MPEG4 (`.mp4`)

**`Blocking`**

This function is synchronized/blocking.

**`Throws`**

[`CameraCaptureError`](CameraCaptureError.md) When any kind of error occured while starting the video recording. Use the [`code`](CameraCaptureError.md#code) property to get the actual error

**`Example`**

```ts
camera.current.startRecording({
  onRecordingFinished: (video) => console.log(video),
  onRecordingError: (error) => console.error(error),
})
setTimeout(() => {
  camera.current.stopRecording()
}, 5000)
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`RecordVideoOptions`](../interfaces/RecordVideoOptions.md) |

#### Returns

`void`

#### Defined in

[Camera.tsx:138](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/Camera.tsx#L138)

___

### stopRecording

▸ **stopRecording**(): `Promise`<`void`\>

Stop the current video recording.

**`Throws`**

[`CameraCaptureError`](CameraCaptureError.md) When any kind of error occured while stopping the video recording. Use the [`code`](CameraCaptureError.md#code) property to get the actual error

**`Example`**

```ts
await camera.current.startRecording()
setTimeout(async () => {
 const video = await camera.current.stopRecording()
}, 5000)
```

#### Returns

`Promise`<`void`\>

#### Defined in

[Camera.tsx:224](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/Camera.tsx#L224)

___

### takePhoto

▸ **takePhoto**(`options?`): `Promise`<[`PhotoFile`](../interfaces/PhotoFile.md)\>

Take a single photo and write it's content to a temporary file.

**`Throws`**

[`CameraCaptureError`](CameraCaptureError.md) When any kind of error occured while capturing the photo. Use the [`code`](CameraCaptureError.md#code) property to get the actual error

**`Example`**

```ts
const photo = await camera.current.takePhoto({
  qualityPrioritization: 'quality',
  flash: 'on',
  enableAutoRedEyeReduction: true
})
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `options?` | [`TakePhotoOptions`](../interfaces/TakePhotoOptions.md) |

#### Returns

`Promise`<[`PhotoFile`](../interfaces/PhotoFile.md)\>

#### Defined in

[Camera.tsx:108](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/Camera.tsx#L108)

___

### getAvailableCameraDevices

▸ `Static` **getAvailableCameraDevices**(): `Promise`<[`CameraDevice`](../interfaces/CameraDevice.md)[]\>

Get a list of all available camera devices on the current phone.

**`Throws`**

[`CameraRuntimeError`](CameraRuntimeError.md) When any kind of error occured while getting all available camera devices. Use the [`code`](CameraRuntimeError.md#code) property to get the actual error

**`Example`**

```ts
const devices = await Camera.getAvailableCameraDevices()
const filtered = devices.filter((d) => matchesMyExpectations(d))
const sorted = devices.sort(sortDevicesByAmountOfCameras)
return {
  back: sorted.find((d) => d.position === "back"),
  front: sorted.find((d) => d.position === "front")
}
```

#### Returns

`Promise`<[`CameraDevice`](../interfaces/CameraDevice.md)[]\>

#### Defined in

[Camera.tsx:276](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/Camera.tsx#L276)

___

### getCameraPermissionStatus

▸ `Static` **getCameraPermissionStatus**(): `Promise`<[`CameraPermissionStatus`](../#camerapermissionstatus)\>

Gets the current Camera Permission Status. Check this before mounting the Camera to ensure
the user has permitted the app to use the camera.

To actually prompt the user for camera permission, use [`requestCameraPermission()`](Camera.md#requestcamerapermission).

**`Throws`**

[`CameraRuntimeError`](CameraRuntimeError.md) When any kind of error occured while getting the current permission status. Use the [`code`](CameraRuntimeError.md#code) property to get the actual error

#### Returns

`Promise`<[`CameraPermissionStatus`](../#camerapermissionstatus)\>

#### Defined in

[Camera.tsx:291](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/Camera.tsx#L291)

___

### getMicrophonePermissionStatus

▸ `Static` **getMicrophonePermissionStatus**(): `Promise`<[`CameraPermissionStatus`](../#camerapermissionstatus)\>

Gets the current Microphone-Recording Permission Status. Check this before mounting the Camera to ensure
the user has permitted the app to use the microphone.

To actually prompt the user for microphone permission, use [`requestMicrophonePermission()`](Camera.md#requestmicrophonepermission).

**`Throws`**

[`CameraRuntimeError`](CameraRuntimeError.md) When any kind of error occured while getting the current permission status. Use the [`code`](CameraRuntimeError.md#code) property to get the actual error

#### Returns

`Promise`<[`CameraPermissionStatus`](../#camerapermissionstatus)\>

#### Defined in

[Camera.tsx:306](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/Camera.tsx#L306)

___

### requestCameraPermission

▸ `Static` **requestCameraPermission**(): `Promise`<[`CameraPermissionRequestResult`](../#camerapermissionrequestresult)\>

Shows a "request permission" alert to the user, and resolves with the new camera permission status.

If the user has previously blocked the app from using the camera, the alert will not be shown
and `"denied"` will be returned.

**`Throws`**

[`CameraRuntimeError`](CameraRuntimeError.md) When any kind of error occured while requesting permission. Use the [`code`](CameraRuntimeError.md#code) property to get the actual error

#### Returns

`Promise`<[`CameraPermissionRequestResult`](../#camerapermissionrequestresult)\>

#### Defined in

[Camera.tsx:321](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/Camera.tsx#L321)

___

### requestMicrophonePermission

▸ `Static` **requestMicrophonePermission**(): `Promise`<[`CameraPermissionRequestResult`](../#camerapermissionrequestresult)\>

Shows a "request permission" alert to the user, and resolves with the new microphone permission status.

If the user has previously blocked the app from using the microphone, the alert will not be shown
and `"denied"` will be returned.

**`Throws`**

[`CameraRuntimeError`](CameraRuntimeError.md) When any kind of error occured while requesting permission. Use the [`code`](CameraRuntimeError.md#code) property to get the actual error

#### Returns

`Promise`<[`CameraPermissionRequestResult`](../#camerapermissionrequestresult)\>

#### Defined in

[Camera.tsx:336](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/Camera.tsx#L336)

---
id: "RecordVideoOptions"
title: "RecordVideoOptions"
sidebar_position: 0
custom_edit_url: null
---

## Properties

### fileType

• `Optional` **fileType**: [`VideoFileType`](../#videofiletype)

Sets the file type to use for the Video Recording.

**`Default`**

"mov"

#### Defined in

[VideoFile.ts:26](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/VideoFile.ts#L26)

___

### flash

• `Optional` **flash**: ``"off"`` \| ``"auto"`` \| ``"on"``

Set the video flash mode. Natively, this just enables the torch while recording.

#### Defined in

[VideoFile.ts:21](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/VideoFile.ts#L21)

___

### onRecordingError

• **onRecordingError**: (`error`: [`CameraCaptureError`](../classes/CameraCaptureError.md)) => `void`

#### Type declaration

▸ (`error`): `void`

Called when there was an unexpected runtime error while recording the video.

##### Parameters

| Name | Type |
| :------ | :------ |
| `error` | [`CameraCaptureError`](../classes/CameraCaptureError.md) |

##### Returns

`void`

#### Defined in

[VideoFile.ts:30](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/VideoFile.ts#L30)

___

### onRecordingFinished

• **onRecordingFinished**: (`video`: [`VideoFile`](VideoFile.md)) => `void`

#### Type declaration

▸ (`video`): `void`

Called when the recording has been successfully saved to file.

##### Parameters

| Name | Type |
| :------ | :------ |
| `video` | [`VideoFile`](VideoFile.md) |

##### Returns

`void`

#### Defined in

[VideoFile.ts:34](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/VideoFile.ts#L34)

___

### videoCodec

• `Optional` **videoCodec**: [`CameraVideoCodec`](../#cameravideocodec)

Set the video codec to record in. Different video codecs affect video quality and video size.
To get a list of all available video codecs use the `getAvailableVideoCodecs()` function.

**`Default`**

undefined

**`Platform`**

iOS

#### Defined in

[VideoFile.ts:42](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/VideoFile.ts#L42)

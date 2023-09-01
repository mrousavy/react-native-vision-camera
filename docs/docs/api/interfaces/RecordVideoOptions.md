---
id: "RecordVideoOptions"
title: "RecordVideoOptions"
sidebar_position: 0
custom_edit_url: null
---

## Properties

### fileType

• `Optional` **fileType**: ``"mov"`` \| ``"mp4"``

Specifies the output file type to record videos into.

#### Defined in

[VideoFile.ts:12](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/VideoFile.ts#L12)

___

### flash

• `Optional` **flash**: ``"off"`` \| ``"auto"`` \| ``"on"``

Set the video flash mode. Natively, this just enables the torch while recording.

#### Defined in

[VideoFile.ts:8](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/VideoFile.ts#L8)

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

[VideoFile.ts:16](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/VideoFile.ts#L16)

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

[VideoFile.ts:20](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/VideoFile.ts#L20)

___

### videoCodec

• `Optional` **videoCodec**: ``"h265"``

The Video Codec to record in.
- `h264`: Widely supported, but might be less efficient, especially with larger sizes or framerates.
- `h265`: The HEVC (High-Efficient-Video-Codec) for higher efficient video recordings.

#### Defined in

[VideoFile.ts:26](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/VideoFile.ts#L26)

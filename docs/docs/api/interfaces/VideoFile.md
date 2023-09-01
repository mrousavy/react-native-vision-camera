---
id: "VideoFile"
title: "VideoFile"
sidebar_position: 0
custom_edit_url: null
---

Represents a Video taken by the Camera written to the local filesystem.

Related: [`Camera.startRecording()`](../classes/Camera.md#startrecording), [`Camera.stopRecording()`](../classes/Camera.md#stoprecording)

## Hierarchy

- [`TemporaryFile`](TemporaryFile.md)

  ↳ **`VideoFile`**

## Properties

### duration

• **duration**: `number`

Represents the duration of the video, in seconds.

#### Defined in

[VideoFile.ts:38](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/VideoFile.ts#L38)

___

### path

• **path**: `string`

The path of the file.

* **Note:** If you want to consume this file (e.g. for displaying it in an `<Image>` component), you might have to add the `file://` prefix.

* **Note:** This file might get deleted once the app closes because it lives in the temp directory.

#### Inherited from

[TemporaryFile](TemporaryFile.md).[path](TemporaryFile.md#path)

#### Defined in

[TemporaryFile.ts:12](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/TemporaryFile.ts#L12)

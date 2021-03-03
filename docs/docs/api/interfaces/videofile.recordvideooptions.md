---
id: "videofile.recordvideooptions"
title: "Interface: RecordVideoOptions"
sidebar_label: "VideoFile.RecordVideoOptions"
custom_edit_url: null
hide_title: true
---

# Interface: RecordVideoOptions

[VideoFile](../modules/videofile.md).RecordVideoOptions

## Properties

### flash

• `Optional` **flash**: *undefined* \| *off* \| *auto* \| *on*

Set the video flash mode. Natively, this just enables the torch while recording.

Defined in: [src/VideoFile.ts:36](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/VideoFile.ts#L36)

___

### onRecordingError

• **onRecordingError**: (`error`: [*CameraCaptureError*](../classes/cameraerror.cameracaptureerror.md)) => *void*

Called when there was an unexpected runtime error while recording the video.

#### Type declaration:

▸ (`error`: [*CameraCaptureError*](../classes/cameraerror.cameracaptureerror.md)): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`error` | [*CameraCaptureError*](../classes/cameraerror.cameracaptureerror.md) |

**Returns:** *void*

Defined in: [src/VideoFile.ts:40](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/VideoFile.ts#L40)

Defined in: [src/VideoFile.ts:40](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/VideoFile.ts#L40)

___

### onRecordingFinished

• **onRecordingFinished**: (`video`: *Readonly*<*Readonly*<{ `path`: *string*  }\> & { `duration`: *number* ; `size`: *number*  }\>) => *void*

Called when the recording has been successfully saved to file.

#### Type declaration:

▸ (`video`: *Readonly*<*Readonly*<{ `path`: *string*  }\> & { `duration`: *number* ; `size`: *number*  }\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`video` | *Readonly*<*Readonly*<{ `path`: *string*  }\> & { `duration`: *number* ; `size`: *number*  }\> |

**Returns:** *void*

Defined in: [src/VideoFile.ts:44](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/VideoFile.ts#L44)

Defined in: [src/VideoFile.ts:44](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/VideoFile.ts#L44)

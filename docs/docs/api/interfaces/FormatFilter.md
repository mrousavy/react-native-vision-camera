---
id: "FormatFilter"
title: "Interface: FormatFilter"
sidebar_label: "FormatFilter"
sidebar_position: 0
custom_edit_url: null
---

## Properties

### targetFps

• `Optional` **targetFps**: `Filter`<`number`\>

The target FPS you want to record video at.
If the FPS requirements can not be met, the format closest to this value will be used.

#### Defined in

devices/getCameraFormat.ts:50

___

### targetPhotoAspectRatio

• `Optional` **targetPhotoAspectRatio**: `Filter`<`number`\>

The target aspect ratio of the photo output, expressed as a factor: `width / height`.

In most cases, you want this to be the same as `targetVideoAspectRatio`, which you often want
to be as close to the screen's aspect ratio as possible (usually ~9:16)

**`Example`**

```ts
const screen = Dimensions.get('screen')
targetPhotoAspectRatio: screen.width / screen.height
```

#### Defined in

devices/getCameraFormat.ts:45

___

### targetPhotoResolution

• `Optional` **targetPhotoResolution**: `Filter`<`Size`\>

The target resolution of the photo output pipeline.
If no format supports the given resolution, the format closest to this value will be used.

#### Defined in

devices/getCameraFormat.ts:20

___

### targetVideoAspectRatio

• `Optional` **targetVideoAspectRatio**: `Filter`<`number`\>

The target aspect ratio of the video (and preview) output, expressed as a factor: `width / height`.

In most cases, you want this to be as close to the screen's aspect ratio as possible (usually ~9:16).

**`Example`**

```ts
const screen = Dimensions.get('screen')
targetVideoAspectRatio: screen.width / screen.height
```

#### Defined in

devices/getCameraFormat.ts:32

___

### targetVideoResolution

• `Optional` **targetVideoResolution**: `Filter`<`Size`\>

The target resolution of the video (and frame processor) output pipeline.
If no format supports the given resolution, the format closest to this value will be used.

#### Defined in

devices/getCameraFormat.ts:15

___

### targetVideoStabilizationMode

• `Optional` **targetVideoStabilizationMode**: `Filter`<[`VideoStabilizationMode`](../#videostabilizationmode-46)\>

The target video stabilization mode you want to use.
If no format supports the target video stabilization mode, the best other matching format will be used.

#### Defined in

devices/getCameraFormat.ts:55

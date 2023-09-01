---
id: "TakeSnapshotOptions"
title: "TakeSnapshotOptions"
sidebar_position: 0
custom_edit_url: null
---

## Properties

### flash

• `Optional` **flash**: ``"off"`` \| ``"on"``

Whether the Flash should be enabled or disabled

**`Default`**

"off"

#### Defined in

[Snapshot.ts:16](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/Snapshot.ts#L16)

___

### quality

• `Optional` **quality**: `number`

Specifies the quality of the JPEG. (0-100, where 100 means best quality (no compression))

It is recommended to set this to `90` or even `80`, since the user probably won't notice a difference between `90`/`80` and `100`.

**`Default`**

100

#### Defined in

[Snapshot.ts:9](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/Snapshot.ts#L9)

___

### skipMetadata

• `Optional` **skipMetadata**: `boolean`

When set to `true`, metadata reading and mapping will be skipped. ([`metadata`](PhotoFile.md#metadata) will be `null`)

This might result in a faster capture, as metadata reading and mapping requires File IO.

**`Default`**

false

**`Platform`**

Android

#### Defined in

[Snapshot.ts:27](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/Snapshot.ts#L27)

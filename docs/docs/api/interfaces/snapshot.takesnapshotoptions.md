---
id: "snapshot.takesnapshotoptions"
title: "Interface: TakeSnapshotOptions"
sidebar_label: "Snapshot.TakeSnapshotOptions"
custom_edit_url: null
hide_title: true
---

# Interface: TakeSnapshotOptions

[Snapshot](../modules/snapshot.md).TakeSnapshotOptions

## Properties

### quality

• `Optional` **quality**: *undefined* \| *number*

Specifies the quality of the JPEG. (0-100, where 100 means best quality (no compression))

It is recommended to set this to `90` or even `80`, since the user probably won't notice a difference between `90`/`80` and `100`.

**`default`** 100

Defined in: [src/Snapshot.ts:9](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Snapshot.ts#L9)

___

### skipMetadata

• `Optional` **skipMetadata**: *undefined* \| *boolean*

When set to `true`, metadata reading and mapping will be skipped. (`PhotoFile.metadata` will be null)

This might result in a faster capture, as metadata reading and mapping requires File IO.

**`default`** false

**`platform`** Android

Defined in: [src/Snapshot.ts:20](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Snapshot.ts#L20)

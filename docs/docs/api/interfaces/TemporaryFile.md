---
id: "TemporaryFile"
title: "TemporaryFile"
sidebar_position: 0
custom_edit_url: null
---

Represents a temporary file in the local filesystem.

## Hierarchy

- **`TemporaryFile`**

  ↳ [`PhotoFile`](PhotoFile.md)

  ↳ [`VideoFile`](VideoFile.md)

## Properties

### path

• **path**: `string`

The path of the file.

* **Note:** If you want to consume this file (e.g. for displaying it in an `<Image>` component), you might have to add the `file://` prefix.

* **Note:** This file might get deleted once the app closes because it lives in the temp directory.

#### Defined in

[TemporaryFile.ts:12](https://github.com/mrousavy/react-native-vision-camera/blob/c66550ed/package/src/TemporaryFile.ts#L12)

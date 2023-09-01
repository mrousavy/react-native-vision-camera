---
id: "Frame"
title: "Frame"
sidebar_position: 0
custom_edit_url: null
---

A single frame, as seen by the camera.

## Properties

### bytesPerRow

• **bytesPerRow**: `number`

Returns the amount of bytes per row.

#### Defined in

[Frame.ts:20](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/Frame.ts#L20)

___

### height

• **height**: `number`

Returns the height of the frame, in pixels.

#### Defined in

[Frame.ts:16](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/Frame.ts#L16)

___

### isValid

• **isValid**: `boolean`

Whether the underlying buffer is still valid or not. The buffer will be released after the frame processor returns, or `close()` is called.

#### Defined in

[Frame.ts:8](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/Frame.ts#L8)

___

### planesCount

• **planesCount**: `number`

Returns the number of planes this frame contains.

#### Defined in

[Frame.ts:24](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/Frame.ts#L24)

___

### width

• **width**: `number`

Returns the width of the frame, in pixels.

#### Defined in

[Frame.ts:12](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/Frame.ts#L12)

## Methods

### close

▸ **close**(): `void`

Closes and disposes the Frame.
Only close frames that you have created yourself, e.g. by copying the frame you receive in a frame processor.

**`Example`**

```ts
const frameProcessor = useFrameProcessor((frame) => {
  const smallerCopy = resize(frame, 480, 270)
  // run AI ...
  smallerCopy.close()
  // don't close `frame`!
})
```

#### Returns

`void`

#### Defined in

[Frame.ts:48](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/Frame.ts#L48)

___

### toString

▸ **toString**(): `string`

Returns a string representation of the frame.

**`Example`**

```ts
console.log(frame.toString()) // -> "3840 x 2160 Frame"
```

#### Returns

`string`

#### Defined in

[Frame.ts:33](https://github.com/mrousavy/react-native-vision-camera/blob/c2fb5bf1/src/Frame.ts#L33)

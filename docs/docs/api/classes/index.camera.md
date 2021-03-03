---
id: "index.camera"
title: "Class: Camera"
sidebar_label: "index.Camera"
custom_edit_url: null
hide_title: true
---

# Class: Camera

[index](../modules/index.md).Camera

### A powerful `<Camera>` component.

The `<Camera>` component's most important (and therefore _required_) properties are:

* `device`: Specifies the [CameraDevice](../modules/index.md#cameradevice) to use. Get a [CameraDevice](../modules/index.md#cameradevice) by using the [useCameraDevices](../modules/index.md#usecameradevices) hook, or manually by using the [Camera.getAvailableCameraDevices](index.camera.md#getavailablecameradevices) function.
* `isActive`: A boolean value that specifies whether the Camera should actively stream video frames or not. This can be compared to a Video component, where `isActive` specifies whether the video is paused or not. If you fully unmount the `<Camera>` component instead of using `isActive={false}`, the Camera will take a bit longer to start again.

**`example`** 
```jsx
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

**`component`** 

## Hierarchy

* *PureComponent*<[*CameraProps*](../modules/camera.md#cameraprops), CameraState\>

  ↳ **Camera**

## Constructors

### constructor

\+ **new Camera**(`props`: [*CameraProps*](../modules/camera.md#cameraprops)): [*Camera*](camera.camera-1.md)

#### Parameters:

Name | Type |
:------ | :------ |
`props` | [*CameraProps*](../modules/camera.md#cameraprops) |

**Returns:** [*Camera*](camera.camera-1.md)

Defined in: [src/Camera.tsx:210](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Camera.tsx#L210)

## Properties

### context

• **context**: *any*

If using the new style context, re-declare this in your class to be the
`React.ContextType` of your `static contextType`.
Should be used with type annotation or static contextType.

```ts
static contextType = MyContext
// For TS pre-3.7:
context!: React.ContextType<typeof MyContext>
// For TS 3.7 and above:
declare context: React.ContextType<typeof MyContext>
```

**`see`** https://reactjs.org/docs/context.html

Defined in: node_modules/@types/react/index.d.ts:480

___

### displayName

• **displayName**: *string*

Defined in: [src/Camera.tsx:208](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Camera.tsx#L208)

___

### props

• `Readonly` **props**: *Readonly*<CameraFormatProps & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> & *Readonly*<{ `children?`: ReactNode  }\> \| *Readonly*<CameraFormatProps & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> & *Readonly*<{ `children?`: ReactNode  }\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> & *Readonly*<{ `children?`: ReactNode  }\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> & *Readonly*<{ `children?`: ReactNode  }\>

Defined in: node_modules/@types/react/index.d.ts:505

___

### ref

• `Private` `Readonly` **ref**: *RefObject*<RefType\>

Defined in: [src/Camera.tsx:210](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Camera.tsx#L210)

___

### refs

• **refs**: *object*

**`deprecated`** 
https://reactjs.org/docs/refs-and-the-dom.html#legacy-api-string-refs

#### Type declaration:

Defined in: node_modules/@types/react/index.d.ts:511

___

### state

• **state**: *Readonly*<CameraState\>

Defined in: node_modules/@types/react/index.d.ts:506

___

### contextType

▪ `Optional` `Static` **contextType**: *undefined* \| *Context*<any\>

If set, `this.context` will be set at runtime to the current value of the given Context.

Usage:

```ts
type MyContext = number
const Ctx = React.createContext<MyContext>(0)

class Foo extends React.Component {
  static contextType = Ctx
  context!: React.ContextType<typeof Ctx>
  render () {
    return <>My context's value: {this.context}</>;
  }
}
```

**`see`** https://reactjs.org/docs/context.html#classcontexttype

Defined in: node_modules/@types/react/index.d.ts:462

___

### displayName

▪ `Static` **displayName**: *string*= 'Camera'

Defined in: [src/Camera.tsx:207](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Camera.tsx#L207)

## Accessors

### handle

• `Private`get **handle**(): *null* \| *number*

**Returns:** *null* \| *number*

Defined in: [src/Camera.tsx:221](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Camera.tsx#L221)

## Methods

### UNSAFE\_componentWillMount

▸ `Optional`**UNSAFE_componentWillMount**(): *void*

Called immediately before mounting occurs, and before `Component#render`.
Avoid introducing any side-effects or subscriptions in this method.

This method will not stop working in React 17.

Note: the presence of getSnapshotBeforeUpdate or getDerivedStateFromProps
prevents this from being invoked.

**`deprecated`** 16.3, use componentDidMount or the constructor instead

**`see`** https://reactjs.org/blog/2018/03/27/update-on-async-rendering.html#initializing-state

**`see`** https://reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path

**Returns:** *void*

Defined in: node_modules/@types/react/index.d.ts:716

___

### UNSAFE\_componentWillReceiveProps

▸ `Optional`**UNSAFE_componentWillReceiveProps**(`nextProps`: *Readonly*<CameraFormatProps & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<CameraFormatProps & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\>, `nextContext`: *any*): *void*

Called when the component may be receiving new props.
React may call this even if props have not changed, so be sure to compare new and existing
props if you only want to handle changes.

Calling `Component#setState` generally does not trigger this method.

This method will not stop working in React 17.

Note: the presence of getSnapshotBeforeUpdate or getDerivedStateFromProps
prevents this from being invoked.

**`deprecated`** 16.3, use static getDerivedStateFromProps instead

**`see`** https://reactjs.org/blog/2018/03/27/update-on-async-rendering.html#updating-state-based-on-props

**`see`** https://reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path

#### Parameters:

Name | Type |
:------ | :------ |
`nextProps` | *Readonly*<CameraFormatProps & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<CameraFormatProps & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> |
`nextContext` | *any* |

**Returns:** *void*

Defined in: node_modules/@types/react/index.d.ts:748

___

### UNSAFE\_componentWillUpdate

▸ `Optional`**UNSAFE_componentWillUpdate**(`nextProps`: *Readonly*<CameraFormatProps & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<CameraFormatProps & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\>, `nextState`: *Readonly*<CameraState\>, `nextContext`: *any*): *void*

Called immediately before rendering when new props or state is received. Not called for the initial render.

Note: You cannot call `Component#setState` here.

This method will not stop working in React 17.

Note: the presence of getSnapshotBeforeUpdate or getDerivedStateFromProps
prevents this from being invoked.

**`deprecated`** 16.3, use getSnapshotBeforeUpdate instead

**`see`** https://reactjs.org/blog/2018/03/27/update-on-async-rendering.html#reading-dom-properties-before-an-update

**`see`** https://reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path

#### Parameters:

Name | Type |
:------ | :------ |
`nextProps` | *Readonly*<CameraFormatProps & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<CameraFormatProps & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> |
`nextState` | *Readonly*<CameraState\> |
`nextContext` | *any* |

**Returns:** *void*

Defined in: node_modules/@types/react/index.d.ts:776

___

### componentDidCatch

▸ `Optional`**componentDidCatch**(`error`: Error, `errorInfo`: ErrorInfo): *void*

Catches exceptions generated in descendant components. Unhandled exceptions will cause
the entire component tree to unmount.

#### Parameters:

Name | Type |
:------ | :------ |
`error` | Error |
`errorInfo` | ErrorInfo |

**Returns:** *void*

Defined in: node_modules/@types/react/index.d.ts:645

___

### componentDidMount

▸ `Optional`**componentDidMount**(): *void*

Called immediately after a component is mounted. Setting state here will trigger re-rendering.

**Returns:** *void*

Defined in: node_modules/@types/react/index.d.ts:624

___

### componentDidUpdate

▸ `Optional`**componentDidUpdate**(`prevProps`: *Readonly*<CameraFormatProps & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<CameraFormatProps & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\>, `prevState`: *Readonly*<CameraState\>, `snapshot?`: *any*): *void*

Called immediately after updating occurs. Not called for the initial render.

The snapshot is only present if getSnapshotBeforeUpdate is present and returns non-null.

#### Parameters:

Name | Type |
:------ | :------ |
`prevProps` | *Readonly*<CameraFormatProps & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<CameraFormatProps & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> |
`prevState` | *Readonly*<CameraState\> |
`snapshot?` | *any* |

**Returns:** *void*

Defined in: node_modules/@types/react/index.d.ts:687

___

### componentWillMount

▸ `Optional`**componentWillMount**(): *void*

Called immediately before mounting occurs, and before `Component#render`.
Avoid introducing any side-effects or subscriptions in this method.

Note: the presence of getSnapshotBeforeUpdate or getDerivedStateFromProps
prevents this from being invoked.

**`deprecated`** 16.3, use componentDidMount or the constructor instead; will stop working in React 17

**`see`** https://reactjs.org/blog/2018/03/27/update-on-async-rendering.html#initializing-state

**`see`** https://reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path

**Returns:** *void*

Defined in: node_modules/@types/react/index.d.ts:702

___

### componentWillReceiveProps

▸ `Optional`**componentWillReceiveProps**(`nextProps`: *Readonly*<CameraFormatProps & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<CameraFormatProps & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\>, `nextContext`: *any*): *void*

Called when the component may be receiving new props.
React may call this even if props have not changed, so be sure to compare new and existing
props if you only want to handle changes.

Calling `Component#setState` generally does not trigger this method.

Note: the presence of getSnapshotBeforeUpdate or getDerivedStateFromProps
prevents this from being invoked.

**`deprecated`** 16.3, use static getDerivedStateFromProps instead; will stop working in React 17

**`see`** https://reactjs.org/blog/2018/03/27/update-on-async-rendering.html#updating-state-based-on-props

**`see`** https://reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path

#### Parameters:

Name | Type |
:------ | :------ |
`nextProps` | *Readonly*<CameraFormatProps & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<CameraFormatProps & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> |
`nextContext` | *any* |

**Returns:** *void*

Defined in: node_modules/@types/react/index.d.ts:731

___

### componentWillUnmount

▸ `Optional`**componentWillUnmount**(): *void*

Called immediately before a component is destroyed. Perform any necessary cleanup in this method, such as
cancelled network requests, or cleaning up any DOM elements created in `componentDidMount`.

**Returns:** *void*

Defined in: node_modules/@types/react/index.d.ts:640

___

### componentWillUpdate

▸ `Optional`**componentWillUpdate**(`nextProps`: *Readonly*<CameraFormatProps & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<CameraFormatProps & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\>, `nextState`: *Readonly*<CameraState\>, `nextContext`: *any*): *void*

Called immediately before rendering when new props or state is received. Not called for the initial render.

Note: You cannot call `Component#setState` here.

Note: the presence of getSnapshotBeforeUpdate or getDerivedStateFromProps
prevents this from being invoked.

**`deprecated`** 16.3, use getSnapshotBeforeUpdate instead; will stop working in React 17

**`see`** https://reactjs.org/blog/2018/03/27/update-on-async-rendering.html#reading-dom-properties-before-an-update

**`see`** https://reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path

#### Parameters:

Name | Type |
:------ | :------ |
`nextProps` | *Readonly*<CameraFormatProps & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<CameraFormatProps & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> |
`nextState` | *Readonly*<CameraState\> |
`nextContext` | *any* |

**Returns:** *void*

Defined in: node_modules/@types/react/index.d.ts:761

___

### focus

▸ **focus**(`point`: [*Point*](../interfaces/point.point-1.md)): *Promise*<void\>

Focus the camera to a specific point in the coordinate system.

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`point` | [*Point*](../interfaces/point.point-1.md) | The point to focus to. This should be relative to the Camera view's coordinate system, and expressed in Pixel on iOS and Points on Android.  * `(0, 0)` means **top left**.  * `(CameraView.width, CameraView.height)` means **bottom right**.  Make sure the value doesn't exceed the CameraView's dimensions.    |

**Returns:** *Promise*<void\>

Defined in: [src/Camera.tsx:326](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Camera.tsx#L326)

___

### forceUpdate

▸ **forceUpdate**(`callback?`: () => *void*): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`callback?` | () => *void* |

**Returns:** *void*

Defined in: node_modules/@types/react/index.d.ts:497

___

### getAvailablePhotoCodecs

▸ **getAvailablePhotoCodecs**(): *Promise*<[*CameraPhotoCodec*](../modules/cameracodec.md#cameraphotocodec)[]\>

Get a list of photo codecs the current camera supports. Returned values are ordered by efficiency (descending).

This function can only be called after the camera has been initialized,
so only use this after the `onInitialized` event has fired.

**Returns:** *Promise*<[*CameraPhotoCodec*](../modules/cameracodec.md#cameraphotocodec)[]\>

Defined in: [src/Camera.tsx:353](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Camera.tsx#L353)

___

### getAvailableVideoCodecs

▸ **getAvailableVideoCodecs**(): *Promise*<[*CameraVideoCodec*](../modules/cameracodec.md#cameravideocodec)[]\>

Get a list of video codecs the current camera supports.  Returned values are ordered by efficiency (descending).

This function can only be called after the camera has been initialized,
so only use this after the `onInitialized` event has fired.

**Returns:** *Promise*<[*CameraVideoCodec*](../modules/cameracodec.md#cameravideocodec)[]\>

Defined in: [src/Camera.tsx:340](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Camera.tsx#L340)

___

### getSnapshotBeforeUpdate

▸ `Optional`**getSnapshotBeforeUpdate**(`prevProps`: *Readonly*<CameraFormatProps & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<CameraFormatProps & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\>, `prevState`: *Readonly*<CameraState\>): *any*

Runs before React applies the result of `render` to the document, and
returns an object to be given to componentDidUpdate. Useful for saving
things such as scroll position before `render` causes changes to it.

Note: the presence of getSnapshotBeforeUpdate prevents any of the deprecated
lifecycle events from running.

#### Parameters:

Name | Type |
:------ | :------ |
`prevProps` | *Readonly*<CameraFormatProps & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<CameraFormatProps & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> |
`prevState` | *Readonly*<CameraState\> |

**Returns:** *any*

Defined in: node_modules/@types/react/index.d.ts:681

___

### onCodeScanned

▸ `Private`**onCodeScanned**(`event?`: *NativeSyntheticEvent*<OnCodeScannedEvent\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`event?` | *NativeSyntheticEvent*<OnCodeScannedEvent\> |

**Returns:** *void*

Defined in: [src/Camera.tsx:445](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Camera.tsx#L445)

___

### onError

▸ `Private`**onError**(`event?`: *NativeSyntheticEvent*<OnErrorEvent\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`event?` | *NativeSyntheticEvent*<OnErrorEvent\> |

**Returns:** *void*

Defined in: [src/Camera.tsx:428](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Camera.tsx#L428)

___

### onInitialized

▸ `Private`**onInitialized**(): *void*

**Returns:** *void*

Defined in: [src/Camera.tsx:441](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Camera.tsx#L441)

___

### render

▸ **render**(): ReactNode

**Returns:** ReactNode

Defined in: [src/Camera.tsx:461](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Camera.tsx#L461)

___

### setState

▸ **setState**<K\>(`state`: *null* \| CameraState \| (`prevState`: *Readonly*<CameraState\>, `props`: *Readonly*<CameraFormatProps & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<CameraFormatProps & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\>) => *null* \| CameraState \| *Pick*<CameraState, K\> \| *Pick*<CameraState, K\>, `callback?`: () => *void*): *void*

#### Type parameters:

Name | Type |
:------ | :------ |
`K` | *cameraId* |

#### Parameters:

Name | Type |
:------ | :------ |
`state` | *null* \| CameraState \| (`prevState`: *Readonly*<CameraState\>, `props`: *Readonly*<CameraFormatProps & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<CameraFormatProps & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\>) => *null* \| CameraState \| *Pick*<CameraState, K\> \| *Pick*<CameraState, K\> |
`callback?` | () => *void* |

**Returns:** *void*

Defined in: node_modules/@types/react/index.d.ts:492

___

### shouldComponentUpdate

▸ `Optional`**shouldComponentUpdate**(`nextProps`: *Readonly*<CameraFormatProps & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<CameraFormatProps & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\>, `nextState`: *Readonly*<CameraState\>, `nextContext`: *any*): *boolean*

Called to determine whether the change in props and state should trigger a re-render.

`Component` always returns true.
`PureComponent` implements a shallow comparison on props and state and returns true if any
props or states have changed.

If false is returned, `Component#render`, `componentWillUpdate`
and `componentDidUpdate` will not be called.

#### Parameters:

Name | Type |
:------ | :------ |
`nextProps` | *Readonly*<CameraFormatProps & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<CameraFormatProps & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & CameraScannerPropsNever & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> \| *Readonly*<*Pick*<CameraFormatProps, never\> & { `colorSpace?`: *undefined* \| *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv* ; `format?`: *undefined* \| *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> ; `fps?`: *undefined* \| *number* ; `hdr?`: *undefined* \| *boolean* ; `lowLightBoost?`: *undefined* \| *boolean* ; `preset?`: *undefined*  } & *Pick*<CameraScannerPropsNever, never\> & { `onCodeScanned`: (`codes`: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *undefined* \| *string* ; `type`: [*CodeType*](../modules/code.md#codetype)  }\>[]) => *void* ; `scannableCodes`: [*CodeType*](../modules/code.md#codetype)[]  } & [*CameraDeviceProps*](../modules/camera.md#cameradeviceprops) & [*CameraDynamicProps*](../modules/camera.md#cameradynamicprops) & [*CameraEventProps*](../modules/camera.md#cameraeventprops) & ViewProps\> |
`nextState` | *Readonly*<CameraState\> |
`nextContext` | *any* |

**Returns:** *boolean*

Defined in: node_modules/@types/react/index.d.ts:635

___

### startRecording

▸ **startRecording**(`options`: [*RecordVideoOptions*](../interfaces/videofile.recordvideooptions.md)): *void*

Start a new video recording.

Records in the following formats:
* **iOS**: QuickTime (`.mov`)
* **Android**: MPEG4 (`.mp4`)

**`blocking`** This function is synchronized/blocking.

**`throws`** {CameraCaptureError} When any kind of error occured. Use the `CameraCaptureError.code` property to get the actual error

**`example`** 
```js
camera.current.startRecording({
  onRecordingFinished: (video) => console.log(video),
  onRecordingError: (error) => console.error(error),
})
setTimeout(() => {
  camera.current.stopRecording()
}, 5000)
```

#### Parameters:

Name | Type |
:------ | :------ |
`options` | [*RecordVideoOptions*](../interfaces/videofile.recordvideooptions.md) |

**Returns:** *void*

Defined in: [src/Camera.tsx:282](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Camera.tsx#L282)

___

### stopRecording

▸ **stopRecording**(): *Promise*<void\>

Stop the current video recording.

**`example`** 
```js
await camera.current.startRecording()
setTimeout(async () => {
 const video = await camera.current.stopRecording()
}, 5000)
```

**Returns:** *Promise*<void\>

Defined in: [src/Camera.tsx:309](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Camera.tsx#L309)

___

### takePhoto

▸ **takePhoto**(`options?`: [*TakePhotoOptions*](../interfaces/photofile.takephotooptions.md)): *Promise*<Readonly<*Readonly*<{ `path`: *string*  }\> & { `height`: *number* ; `isRawPhoto`: *boolean* ; `metadata`: { `DPIHeight`: *number* ; `DPIWidth`: *number* ; `Orientation`: *number* ; `{Exif}`: { `ApertureValue`: *number* ; `BrightnessValue`: *number* ; `ColorSpace`: *number* ; `DateTimeDigitized`: *string* ; `DateTimeOriginal`: *string* ; `ExifVersion`: *string* ; `ExposureBiasValue`: *number* ; `ExposureMode`: *number* ; `ExposureProgram`: *number* ; `ExposureTime`: *number* ; `FNumber`: *number* ; `Flash`: *number* ; `FocalLenIn35mmFilm`: *number* ; `FocalLength`: *number* ; `ISOSpeedRatings`: *number*[] ; `LensMake`: *string* ; `LensModel`: *string* ; `LensSpecification`: *number*[] ; `MeteringMode`: *number* ; `OffsetTime`: *string* ; `OffsetTimeDigitized`: *string* ; `OffsetTimeOriginal`: *string* ; `PixelXDimension`: *number* ; `PixelYDimension`: *number* ; `SceneType`: *number* ; `SensingMethod`: *number* ; `ShutterSpeedValue`: *number* ; `SubjectArea`: *number*[] ; `SubsecTimeDigitized`: *string* ; `SubsecTimeOriginal`: *string* ; `WhiteBalance`: *number*  } ; `{MakerApple}?`: *undefined* \| *Record*<string, unknown\> ; `{TIFF}`: { `DateTime`: *string* ; `HostComputer?`: *undefined* \| *string* ; `Make`: *string* ; `Model`: *string* ; `ResolutionUnit`: *number* ; `Software`: *string* ; `XResolution`: *number* ; `YResolution`: *number*  }  } ; `thumbnail?`: *undefined* \| *Record*<string, unknown\> ; `width`: *number*  }\>\>

Take a single photo and write it's content to a temporary file.

**`throws`** {CameraCaptureError} When any kind of error occured. Use the `CameraCaptureError.code` property to get the actual error

#### Parameters:

Name | Type |
:------ | :------ |
`options?` | [*TakePhotoOptions*](../interfaces/photofile.takephotooptions.md) |

**Returns:** *Promise*<Readonly<*Readonly*<{ `path`: *string*  }\> & { `height`: *number* ; `isRawPhoto`: *boolean* ; `metadata`: { `DPIHeight`: *number* ; `DPIWidth`: *number* ; `Orientation`: *number* ; `{Exif}`: { `ApertureValue`: *number* ; `BrightnessValue`: *number* ; `ColorSpace`: *number* ; `DateTimeDigitized`: *string* ; `DateTimeOriginal`: *string* ; `ExifVersion`: *string* ; `ExposureBiasValue`: *number* ; `ExposureMode`: *number* ; `ExposureProgram`: *number* ; `ExposureTime`: *number* ; `FNumber`: *number* ; `Flash`: *number* ; `FocalLenIn35mmFilm`: *number* ; `FocalLength`: *number* ; `ISOSpeedRatings`: *number*[] ; `LensMake`: *string* ; `LensModel`: *string* ; `LensSpecification`: *number*[] ; `MeteringMode`: *number* ; `OffsetTime`: *string* ; `OffsetTimeDigitized`: *string* ; `OffsetTimeOriginal`: *string* ; `PixelXDimension`: *number* ; `PixelYDimension`: *number* ; `SceneType`: *number* ; `SensingMethod`: *number* ; `ShutterSpeedValue`: *number* ; `SubjectArea`: *number*[] ; `SubsecTimeDigitized`: *string* ; `SubsecTimeOriginal`: *string* ; `WhiteBalance`: *number*  } ; `{MakerApple}?`: *undefined* \| *Record*<string, unknown\> ; `{TIFF}`: { `DateTime`: *string* ; `HostComputer?`: *undefined* \| *string* ; `Make`: *string* ; `Model`: *string* ; `ResolutionUnit`: *number* ; `Software`: *string* ; `XResolution`: *number* ; `YResolution`: *number*  }  } ; `thumbnail?`: *undefined* \| *Record*<string, unknown\> ; `width`: *number*  }\>\>

Defined in: [src/Camera.tsx:234](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Camera.tsx#L234)

___

### takeSnapshot

▸ **takeSnapshot**(`options?`: [*TakeSnapshotOptions*](../interfaces/snapshot.takesnapshotoptions.md)): *Promise*<Readonly<*Readonly*<{ `path`: *string*  }\> & { `height`: *number* ; `isRawPhoto`: *boolean* ; `metadata`: { `DPIHeight`: *number* ; `DPIWidth`: *number* ; `Orientation`: *number* ; `{Exif}`: { `ApertureValue`: *number* ; `BrightnessValue`: *number* ; `ColorSpace`: *number* ; `DateTimeDigitized`: *string* ; `DateTimeOriginal`: *string* ; `ExifVersion`: *string* ; `ExposureBiasValue`: *number* ; `ExposureMode`: *number* ; `ExposureProgram`: *number* ; `ExposureTime`: *number* ; `FNumber`: *number* ; `Flash`: *number* ; `FocalLenIn35mmFilm`: *number* ; `FocalLength`: *number* ; `ISOSpeedRatings`: *number*[] ; `LensMake`: *string* ; `LensModel`: *string* ; `LensSpecification`: *number*[] ; `MeteringMode`: *number* ; `OffsetTime`: *string* ; `OffsetTimeDigitized`: *string* ; `OffsetTimeOriginal`: *string* ; `PixelXDimension`: *number* ; `PixelYDimension`: *number* ; `SceneType`: *number* ; `SensingMethod`: *number* ; `ShutterSpeedValue`: *number* ; `SubjectArea`: *number*[] ; `SubsecTimeDigitized`: *string* ; `SubsecTimeOriginal`: *string* ; `WhiteBalance`: *number*  } ; `{MakerApple}?`: *undefined* \| *Record*<string, unknown\> ; `{TIFF}`: { `DateTime`: *string* ; `HostComputer?`: *undefined* \| *string* ; `Make`: *string* ; `Model`: *string* ; `ResolutionUnit`: *number* ; `Software`: *string* ; `XResolution`: *number* ; `YResolution`: *number*  }  } ; `thumbnail?`: *undefined* \| *Record*<string, unknown\> ; `width`: *number*  }\>\>

Take a snapshot of the current preview view.

This can be used as an alternative to `takePhoto()` if speed is more important than quality

**`platform`** Android

#### Parameters:

Name | Type |
:------ | :------ |
`options?` | [*TakeSnapshotOptions*](../interfaces/snapshot.takesnapshotoptions.md) |

**Returns:** *Promise*<Readonly<*Readonly*<{ `path`: *string*  }\> & { `height`: *number* ; `isRawPhoto`: *boolean* ; `metadata`: { `DPIHeight`: *number* ; `DPIWidth`: *number* ; `Orientation`: *number* ; `{Exif}`: { `ApertureValue`: *number* ; `BrightnessValue`: *number* ; `ColorSpace`: *number* ; `DateTimeDigitized`: *string* ; `DateTimeOriginal`: *string* ; `ExifVersion`: *string* ; `ExposureBiasValue`: *number* ; `ExposureMode`: *number* ; `ExposureProgram`: *number* ; `ExposureTime`: *number* ; `FNumber`: *number* ; `Flash`: *number* ; `FocalLenIn35mmFilm`: *number* ; `FocalLength`: *number* ; `ISOSpeedRatings`: *number*[] ; `LensMake`: *string* ; `LensModel`: *string* ; `LensSpecification`: *number*[] ; `MeteringMode`: *number* ; `OffsetTime`: *string* ; `OffsetTimeDigitized`: *string* ; `OffsetTimeOriginal`: *string* ; `PixelXDimension`: *number* ; `PixelYDimension`: *number* ; `SceneType`: *number* ; `SensingMethod`: *number* ; `ShutterSpeedValue`: *number* ; `SubjectArea`: *number*[] ; `SubsecTimeDigitized`: *string* ; `SubsecTimeOriginal`: *string* ; `WhiteBalance`: *number*  } ; `{MakerApple}?`: *undefined* \| *Record*<string, unknown\> ; `{TIFF}`: { `DateTime`: *string* ; `HostComputer?`: *undefined* \| *string* ; `Make`: *string* ; `Model`: *string* ; `ResolutionUnit`: *number* ; `Software`: *string* ; `XResolution`: *number* ; `YResolution`: *number*  }  } ; `thumbnail?`: *undefined* \| *Record*<string, unknown\> ; `width`: *number*  }\>\>

Defined in: [src/Camera.tsx:249](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Camera.tsx#L249)

___

### getAvailableCameraDevices

▸ `Static`**getAvailableCameraDevices**(): *Promise*<Readonly<{ `devices`: [*PhysicalCameraDeviceType*](../modules/cameradevice.md#physicalcameradevicetype)[] ; `formats`: *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\>[] ; `hasFlash`: *boolean* ; `hasTorch`: *boolean* ; `id`: *string* ; `isMultiCam`: *boolean* ; `maxZoom`: *number* ; `minZoom`: *number* ; `name`: *string* ; `neutralZoom`: *number* ; `position`: [*CameraPosition*](../modules/cameraposition.md#cameraposition) ; `supportsLowLightBoost`: *boolean*  }\>[]\>

Get a list of all available camera devices on the current phone.

**Returns:** *Promise*<Readonly<{ `devices`: [*PhysicalCameraDeviceType*](../modules/cameradevice.md#physicalcameradevicetype)[] ; `formats`: *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](../modules/cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](../modules/cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](../modules/cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\>[] ; `hasFlash`: *boolean* ; `hasTorch`: *boolean* ; `id`: *string* ; `isMultiCam`: *boolean* ; `maxZoom`: *number* ; `minZoom`: *number* ; `name`: *string* ; `neutralZoom`: *number* ; `position`: [*CameraPosition*](../modules/cameraposition.md#cameraposition) ; `supportsLowLightBoost`: *boolean*  }\>[]\>

Defined in: [src/Camera.tsx:366](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Camera.tsx#L366)

___

### getCameraPermissionStatus

▸ `Static`**getCameraPermissionStatus**(): *Promise*<[*CameraPermissionStatus*](../modules/camera.md#camerapermissionstatus)\>

Gets the current Camera Permission Status. Check this before mounting the Camera to ensure
the user has permitted the app to use the camera.

To actually prompt the user for camera permission, use `Camera.requestCameraPermission()`.

**Returns:** *Promise*<[*CameraPermissionStatus*](../modules/camera.md#camerapermissionstatus)\>

Defined in: [src/Camera.tsx:379](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Camera.tsx#L379)

___

### getDerivedStateFromProps

▸ `Static`**getDerivedStateFromProps**(`props`: [*CameraProps*](../modules/camera.md#cameraprops), `state`: CameraState): *null* \| CameraState

#### Parameters:

Name | Type |
:------ | :------ |
`props` | [*CameraProps*](../modules/camera.md#cameraprops) |
`state` | CameraState |

**Returns:** *null* \| CameraState

Defined in: [src/Camera.tsx:454](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Camera.tsx#L454)

___

### getMicrophonePermissionStatus

▸ `Static`**getMicrophonePermissionStatus**(): *Promise*<[*CameraPermissionStatus*](../modules/camera.md#camerapermissionstatus)\>

Gets the current Microphone-Recording Permission Status. Check this before mounting the Camera to ensure
the user has permitted the app to use the microphone.

To actually prompt the user for microphone permission, use `Camera.requestMicrophonePermission()`.

**Returns:** *Promise*<[*CameraPermissionStatus*](../modules/camera.md#camerapermissionstatus)\>

Defined in: [src/Camera.tsx:392](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Camera.tsx#L392)

___

### requestCameraPermission

▸ `Static`**requestCameraPermission**(): *Promise*<[*CameraPermissionRequestResult*](../modules/camera.md#camerapermissionrequestresult)\>

Shows a "request permission" alert to the user, and resolves with the new camera permission status.

If the user has previously blocked the app from using the camera, the alert will not be shown
and `"denied"` will be returned.

**Returns:** *Promise*<[*CameraPermissionRequestResult*](../modules/camera.md#camerapermissionrequestresult)\>

Defined in: [src/Camera.tsx:405](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Camera.tsx#L405)

___

### requestMicrophonePermission

▸ `Static`**requestMicrophonePermission**(): *Promise*<[*CameraPermissionRequestResult*](../modules/camera.md#camerapermissionrequestresult)\>

Shows a "request permission" alert to the user, and resolves with the new microphone permission status.

If the user has previously blocked the app from using the microphone, the alert will not be shown
and `"denied"` will be returned.

**Returns:** *Promise*<[*CameraPermissionRequestResult*](../modules/camera.md#camerapermissionrequestresult)\>

Defined in: [src/Camera.tsx:418](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Camera.tsx#L418)

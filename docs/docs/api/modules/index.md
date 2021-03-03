---
id: "index"
title: "Module: index"
sidebar_label: "index"
custom_edit_url: null
hide_title: true
---

# Module: index

## Table of contents

### Classes

- [Camera](../classes/index.camera.md)
- [CameraCaptureError](../classes/index.cameracaptureerror.md)
- [CameraRuntimeError](../classes/index.cameraruntimeerror.md)

### Interfaces

- [ErrorWithCause](../interfaces/index.errorwithcause.md)
- [Point](../interfaces/index.point.md)
- [RecordVideoOptions](../interfaces/index.recordvideooptions.md)
- [TakePhotoOptions](../interfaces/index.takephotooptions.md)
- [TakeSnapshotOptions](../interfaces/index.takesnapshotoptions.md)

## Type aliases

### AutoFocusSystem

Ƭ **AutoFocusSystem**: *contrast-detection* \| *phase-detection* \| *none*

Indicates a format's autofocus system.

* `"none"`: Indicates that autofocus is not available
* `"contrast-detection"`: Indicates that autofocus is achieved by contrast detection. Contrast detection performs a focus scan to find the optimal position
* `"phase-detection"`: Indicates that autofocus is achieved by phase detection. Phase detection has the ability to achieve focus in many cases without a focus scan. Phase detection autofocus is typically less visually intrusive than contrast detection autofocus

Defined in: [src/CameraDevice.ts:64](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraDevice.ts#L64)

___

### CameraDevice

Ƭ **CameraDevice**: *Readonly*<{ `devices`: [*PhysicalCameraDeviceType*](cameradevice.md#physicalcameradevicetype)[] ; `formats`: [*CameraDeviceFormat*](cameradevice.md#cameradeviceformat)[] ; `hasFlash`: *boolean* ; `hasTorch`: *boolean* ; `id`: *string* ; `isMultiCam`: *boolean* ; `maxZoom`: *number* ; `minZoom`: *number* ; `name`: *string* ; `neutralZoom`: *number* ; `position`: [*CameraPosition*](cameraposition.md#cameraposition) ; `supportsLowLightBoost`: *boolean*  }\>

Represents a camera device discovered by the `Camera.getAvailableCameraDevices()` function

Defined in: [src/CameraDevice.ts:159](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraDevice.ts#L159)

___

### CameraDeviceFormat

Ƭ **CameraDeviceFormat**: *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: [*FrameRateRange*](cameradevice.md#frameraterange)[] ; `isHighestPhotoQualitySupported?`: *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *number*  }\>

A Camera Device's video format. Do not create instances of this type yourself, only use `Camera.getAvailableCameraDevices(...)`.

Defined in: [src/CameraDevice.ts:85](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraDevice.ts#L85)

___

### CameraDeviceProps

Ƭ **CameraDeviceProps**: *object*

#### Type declaration:

Name | Type | Description |
:------ | :------ | :------ |
`device` | [*CameraDevice*](cameradevice.md#cameradevice) | The Camera Device to use   |
`enableDepthData`? | *boolean* | Also captures data from depth-perception sensors. (e.g. disparity maps)  **`default`** false  |
`enableHighResolutionCapture`? | *boolean* | Indicates whether the photo render pipeline should be configured to deliver high resolution still images  **`default`** false  |
`enablePortraitEffectsMatteDelivery`? | *boolean* | A boolean specifying whether the photo render pipeline is prepared for portrait effects matte delivery.  When enabling this, you must also set `enableDepthData` to `true`.   **`platform`** iOS 12.0+  **`default`** false  |

Defined in: [src/Camera.tsx:73](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Camera.tsx#L73)

___

### CameraDynamicProps

Ƭ **CameraDynamicProps**: *object*

#### Type declaration:

Name | Type | Description |
:------ | :------ | :------ |
`enableZoomGesture`? | *boolean* | Enables or disables the pinch to zoom gesture  **`default`** false  |
`isActive` | *boolean* | Whether the Camera should actively stream video frames, or not.  This can be compared to a Video component, where `isActive` specifies whether the video is paused or not.  > Note: If you fully unmount the `<Camera>` component instead of using `isActive={false}`, the Camera will take a bit longer to start again. In return, it will use less resources since the Camera will be completely destroyed when unmounted.    |
`torch`? | *off* \| *on* | Set the current torch mode.  Note: The torch is only available on `"back"` cameras, and isn't supported by every phone.   **`default`** "off"  |
`zoom`? | *number* | Specifies the zoom factor of the current camera, in percent. (`0.0` - `1.0`)  **`default`** 0.0  |

Defined in: [src/Camera.tsx:102](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Camera.tsx#L102)

___

### CameraEventProps

Ƭ **CameraEventProps**: *object*

#### Type declaration:

Name | Type | Description |
:------ | :------ | :------ |
`onError`? | (`error`: [*CameraRuntimeError*](../classes/cameraerror.cameraruntimeerror.md)) => *void* | Called when any kind of runtime error occured.   |
`onInitialized`? | () => *void* | Called when the camera was successfully initialized.   |

Defined in: [src/Camera.tsx:133](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Camera.tsx#L133)

___

### CameraPermissionRequestResult

Ƭ **CameraPermissionRequestResult**: *authorized* \| *denied*

Defined in: [src/Camera.tsx:152](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Camera.tsx#L152)

___

### CameraPermissionStatus

Ƭ **CameraPermissionStatus**: *authorized* \| *not-determined* \| *denied* \| *restricted*

Defined in: [src/Camera.tsx:151](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Camera.tsx#L151)

___

### CameraPhotoCodec

Ƭ **CameraPhotoCodec**: *hevc* \| *jpeg* \| *hevc-alpha*

Available Photo Codec types used for taking a photo.

* `"hevc"`: The HEVC video codec. _(iOS 11.0+)_
* `"jpeg"`: The JPEG (`jpeg`) video codec. _(iOS 11.0+)_
* `"hevc-alpha"`: The HEVC (`muxa`) video codec that supports an alpha channel. This constant is used to select the appropriate encoder, but is NOT used on the encoded content, which is backwards compatible and hence uses `"hvc1"` as its codec type. _(iOS 13.0+)_

Defined in: [src/CameraCodec.ts:33](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraCodec.ts#L33)

___

### CameraPosition

Ƭ **CameraPosition**: *front* \| *back* \| *unspecified* \| *external*

Represents the camera device position.

* `"back"`: Indicates that the device is physically located on the back of the system hardware
* `"front"`: Indicates that the device is physically located on the front of the system hardware

#### iOS only
* `"unspecified"`: Indicates that the device's position relative to the system hardware is unspecified

#### Android only
* `"external"`: The camera device is an external camera, and has no fixed facing relative to the device's screen. (Android only)

Defined in: [src/CameraPosition.ts:13](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraPosition.ts#L13)

___

### CameraPreset

Ƭ **CameraPreset**: *cif-352x288* \| *hd-1280x720* \| *hd-1920x1080* \| *hd-3840x2160* \| *high* \| *iframe-1280x720* \| *iframe-960x540* \| *input-priority* \| *low* \| *medium* \| *photo* \| *vga-640x480*

Indicates the quality level or bit rate of the output.

* `"cif-352x288"`: Specifies capture settings suitable for CIF quality (352 x 288 pixel) video output
* `"hd-1280x720"`: Specifies capture settings suitable for 720p quality (1280 x 720 pixel) video output.
* `"hd-1920x1080"`: Capture settings suitable for 1080p-quality (1920 x 1080 pixels) video output.
* `"hd-3840x2160"`: Capture settings suitable for 2160p-quality (3840 x 2160 pixels, "4k") video output.
* `"high"`: Specifies capture settings suitable for high-quality video and audio output.
* `"iframe-1280x720"`: Specifies capture settings to achieve 1280 x 720 quality iFrame H.264 video at about 40 Mbits/sec with AAC audio.
* `"iframe-960x540"`: Specifies capture settings to achieve 960 x 540 quality iFrame H.264 video at about 30 Mbits/sec with AAC audio.
* `"input-priority"`: Specifies that the capture session does not control audio and video output settings.
* `"low"`: Specifies capture settings suitable for output video and audio bit rates suitable for sharing over 3G.
* `"medium"`: Specifies capture settings suitable for output video and audio bit rates suitable for sharing over WiFi.
* `"photo"`: Specifies capture settings suitable for high-resolution photo quality output.
* `"vga-640x480"`: Specifies capture settings suitable for VGA quality (640 x 480 pixel) video output.

Defined in: [src/CameraPreset.ts:17](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraPreset.ts#L17)

___

### CameraProps

Ƭ **CameraProps**: CameraPresetProps \| CameraFormatProps & CameraScannerPropsNever \| [*CameraScannerProps*](camera.md#camerascannerprops) & [*CameraDeviceProps*](camera.md#cameradeviceprops) & [*CameraDynamicProps*](camera.md#cameradynamicprops) & [*CameraEventProps*](camera.md#cameraeventprops) & ViewProps

Defined in: [src/Camera.tsx:144](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Camera.tsx#L144)

___

### CameraScannerProps

Ƭ **CameraScannerProps**: *Modify*<CameraScannerPropsNever, { `onCodeScanned`: (`codes`: [*Code*](code.md#code)[]) => *void* ; `scannableCodes`: [*CodeType*](code.md#codetype)[]  }\>

Defined in: [src/Camera.tsx:65](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Camera.tsx#L65)

___

### CameraVideoCodec

Ƭ **CameraVideoCodec**: *h264* \| *hevc* \| *hevc-alpha* \| *jpeg* \| *pro-res-4444* \| *pro-res-422* \| *pro-res-422-hq* \| *pro-res-422-lt* \| *pro-res-422-proxy*

Available Video Codec types used for recording a video.

* `"hevc"`: The HEVC video codec. _(iOS 11.0+)_
* `"h264"`: The H.264 (`avc1`) video codec. _(iOS 11.0+)_
* `"jpeg"`: The JPEG (`jpeg`) video codec. _(iOS 11.0+)_
* `"pro-res-4444"`: The Apple ProRes 4444 (`ap4h`) video codec. _(iOS 11.0+)_
* `"pro-res-422"`: The Apple ProRes 422 (`apcn`) video codec. _(iOS 11.0+)_
* `"pro-res-422-hq"`: The Apple ProRes 422 HQ (`apch`) video codec. _(iOS 13.0+)_
* `"pro-res-422-lt"`: The Apple ProRes 422 LT (`apcs`) video codec. _(iOS 13.0+)_
* `"pro-res-422-proxy"`: The Apple ProRes 422 Proxy (`apco`) video codec. _(iOS 13.0+)_
* `"hevc-alpha"`: The HEVC (`muxa`) video codec that supports an alpha channel. This constant is used to select the appropriate encoder, but is NOT used on the encoded content, which is backwards compatible and hence uses `"hvc1"` as its codec type. _(iOS 13.0+)_

Defined in: [src/CameraCodec.ts:14](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraCodec.ts#L14)

___

### CaptureError

Ƭ **CaptureError**: *capture/invalid-photo-format* \| *capture/encoder-error* \| *capture/muxer-error* \| *capture/recording-in-progress* \| *capture/no-recording-in-progress* \| *capture/file-io-error* \| *capture/create-temp-file-error* \| *capture/invalid-photo-codec* \| *capture/not-bound-error* \| *capture/capture-type-not-supported* \| *capture/unknown*

Defined in: [src/CameraError.ts:24](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraError.ts#L24)

___

### Code

Ƭ **Code**: *Readonly*<{ `bounds`: { `height`: *number* ; `maxX`: *number* ; `maxY`: *number* ; `minX`: *number* ; `minY`: *number* ; `width`: *number*  } ; `code?`: *string* ; `type`: [*CodeType*](code.md#codetype)  }\>

Represents a File in the local filesystem.

Defined in: [src/Code.ts:27](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Code.ts#L27)

___

### CodeType

Ƭ **CodeType**: *cat-body* \| *dog-body* \| *human-body* \| *salient-object* \| *aztec* \| *code-128* \| *code-39* \| *code-39-mod-43* \| *code-93* \| *data-matrix* \| *ean-13* \| *ean-8* \| *face* \| *interleaved-2-of-5* \| *itf-14* \| *pdf-417* \| *qr* \| *upce*

Available code types

Defined in: [src/Code.ts:4](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/Code.ts#L4)

___

### ColorSpace

Ƭ **ColorSpace**: *hlg-bt2020* \| *p3-d65* \| *srgb* \| *yuv*

Indicates a format's color space.

#### The following colorspaces are available on iOS:
* `"srgb"`: The sGRB color space (https://www.w3.org/Graphics/Color/srgb)
* `"p3-d65"`: The P3 D65 wide color space which uses Illuminant D65 as the white point
* `"hlg-bt2020"`: The BT2020 wide color space which uses Illuminant D65 as the white point and Hybrid Log-Gamma as the transfer function

#### The following colorspaces are available on Android:
* `"yuv"`: The YCbCr color space.

Defined in: [src/CameraDevice.ts:55](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraDevice.ts#L55)

___

### DeviceError

Ƭ **DeviceError**: *device/configuration-error* \| *device/no-device* \| *device/invalid-device* \| *device/torch-unavailable* \| *device/microphone-unavailable* \| *device/low-light-boost-not-supported* \| *device/focus-not-supported* \| *device/camera-not-available-on-simulator*

Defined in: [src/CameraError.ts:8](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraError.ts#L8)

___

### FormatError

Ƭ **FormatError**: *format/invalid-fps* \| *format/invalid-hdr* \| *format/invalid-low-light-boost* \| *format/invalid-format* \| *format/invalid-preset*

Defined in: [src/CameraError.ts:17](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraError.ts#L17)

___

### FrameRateRange

Ƭ **FrameRateRange**: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>

Defined in: [src/CameraDevice.ts:77](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraDevice.ts#L77)

___

### LogicalCameraDeviceType

Ƭ **LogicalCameraDeviceType**: *dual-camera* \| *dual-wide-camera* \| *triple-camera* \| *true-depth-camera*

Indentifiers for a logical camera (Combinations of multiple physical cameras to create a single logical camera).

* `"dual-camera"`: A combination of wide-angle and telephoto cameras that creates a capture device.
* `"dual-wide-camera"`: A device that consists of two cameras of fixed focal length, one ultrawide angle and one wide angle.
* `"triple-camera"`: A device that consists of three cameras of fixed focal length, one ultrawide angle, one wide angle, and one telephoto.
* `"true-depth-camera"`: A combination of cameras and other sensors that creates a capture device capable of photo, video, and depth capture.

Defined in: [src/CameraDevice.ts:20](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraDevice.ts#L20)

___

### ParameterError

Ƭ **ParameterError**: *parameter/invalid-parameter* \| *parameter/unsupported-os* \| *parameter/unsupported-output* \| *parameter/unsupported-input* \| *parameter/invalid-combination*

Defined in: [src/CameraError.ts:2](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraError.ts#L2)

___

### PermissionError

Ƭ **PermissionError**: *permission/microphone-permission-denied* \| *permission/camera-permission-denied*

Defined in: [src/CameraError.ts:1](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraError.ts#L1)

___

### PhotoFile

Ƭ **PhotoFile**: *Readonly*<[*TemporaryFile*](temporaryfile.md#temporaryfile) & { `height`: *number* ; `isRawPhoto`: *boolean* ; `metadata`: { `DPIHeight`: *number* ; `DPIWidth`: *number* ; `Orientation`: *number* ; `{Exif}`: { `ApertureValue`: *number* ; `BrightnessValue`: *number* ; `ColorSpace`: *number* ; `DateTimeDigitized`: *string* ; `DateTimeOriginal`: *string* ; `ExifVersion`: *string* ; `ExposureBiasValue`: *number* ; `ExposureMode`: *number* ; `ExposureProgram`: *number* ; `ExposureTime`: *number* ; `FNumber`: *number* ; `Flash`: *number* ; `FocalLenIn35mmFilm`: *number* ; `FocalLength`: *number* ; `ISOSpeedRatings`: *number*[] ; `LensMake`: *string* ; `LensModel`: *string* ; `LensSpecification`: *number*[] ; `MeteringMode`: *number* ; `OffsetTime`: *string* ; `OffsetTimeDigitized`: *string* ; `OffsetTimeOriginal`: *string* ; `PixelXDimension`: *number* ; `PixelYDimension`: *number* ; `SceneType`: *number* ; `SensingMethod`: *number* ; `ShutterSpeedValue`: *number* ; `SubjectArea`: *number*[] ; `SubsecTimeDigitized`: *string* ; `SubsecTimeOriginal`: *string* ; `WhiteBalance`: *number*  } ; `{MakerApple}?`: *Record*<string, unknown\> ; `{TIFF}`: { `DateTime`: *string* ; `HostComputer?`: *string* ; `Make`: *string* ; `Model`: *string* ; `ResolutionUnit`: *number* ; `Software`: *string* ; `XResolution`: *number* ; `YResolution`: *number*  }  } ; `thumbnail?`: *Record*<string, unknown\> ; `width`: *number*  }\>

Represents a Photo taken by the Camera written to the local filesystem.

Defined in: [src/PhotoFile.ts:68](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/PhotoFile.ts#L68)

___

### PhysicalCameraDeviceType

Ƭ **PhysicalCameraDeviceType**: *ultra-wide-angle-camera* \| *wide-angle-camera* \| *telephoto-camera*

Indentifiers for a physical camera (one that actually exists on the back/front of the device)

* `"ultra-wide-angle-camera"`: A built-in camera with a shorter focal length than that of a wide-angle camera. (focal length between below 24mm)
* `"wide-angle-camera"`: A built-in wide-angle camera. (focal length between 24mm and 35mm)
* `"telephoto-camera"`: A built-in camera device with a longer focal length than a wide-angle camera. (focal length between above 85mm)

Defined in: [src/CameraDevice.ts:10](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraDevice.ts#L10)

___

### SessionError

Ƭ **SessionError**: *session/camera-not-ready* \| *session/audio-session-setup-failed*

Defined in: [src/CameraError.ts:23](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraError.ts#L23)

___

### Size

Ƭ **Size**: *object*

Represents a Size in any unit.

#### Type declaration:

Name | Type | Description |
:------ | :------ | :------ |
`height` | *number* | Points in height.   |
`width` | *number* | Points in width.   |

Defined in: [src/utils/FormatFilter.ts:36](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/utils/FormatFilter.ts#L36)

___

### SystemError

Ƭ **SystemError**: *system/no-camera-manager*

Defined in: [src/CameraError.ts:36](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraError.ts#L36)

___

### TemporaryFile

Ƭ **TemporaryFile**: *Readonly*<{ `path`: *string*  }\>

Represents a temporary file in the local filesystem.

Defined in: [src/TemporaryFile.ts:4](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/TemporaryFile.ts#L4)

___

### UnknownError

Ƭ **UnknownError**: *unknown/unknown*

Defined in: [src/CameraError.ts:37](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraError.ts#L37)

___

### VideoFile

Ƭ **VideoFile**: *Readonly*<[*TemporaryFile*](temporaryfile.md#temporaryfile) & { `duration`: *number* ; `size`: *number*  }\>

Represents a Video taken by the Camera written to the local filesystem.

Defined in: [src/VideoFile.ts:50](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/VideoFile.ts#L50)

___

### VideoStabilizationMode

Ƭ **VideoStabilizationMode**: *off* \| *standard* \| *cinematic* \| *cinematic-extended* \| *auto*

Indicates a format's supported video stabilization mode

* `"off"`: Indicates that video should not be stabilized
* `"standard"`: Indicates that video should be stabilized using the standard video stabilization algorithm introduced with iOS 5.0. Standard video stabilization has a reduced field of view. Enabling video stabilization may introduce additional latency into the video capture pipeline
* `"cinematic"`: Indicates that video should be stabilized using the cinematic stabilization algorithm for more dramatic results. Cinematic video stabilization has a reduced field of view compared to standard video stabilization. Enabling cinematic video stabilization introduces much more latency into the video capture pipeline than standard video stabilization and consumes significantly more system memory. Use narrow or identical min and max frame durations in conjunction with this mode
* `"cinematic-extended"`: Indicates that the video should be stabilized using the extended cinematic stabilization algorithm. Enabling extended cinematic stabilization introduces longer latency into the video capture pipeline compared to the AVCaptureVideoStabilizationModeCinematic and consumes more memory, but yields improved stability. It is recommended to use identical or similar min and max frame durations in conjunction with this mode (iOS 13.0+)
* `"auto"`: Indicates that the most appropriate video stabilization mode for the device and format should be chosen automatically

Defined in: [src/CameraDevice.ts:75](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraDevice.ts#L75)

## Functions

### filterFormatsByAspectRatio

▸ `Const`**filterFormatsByAspectRatio**(`formats`: *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\>[], `viewSize?`: [*Size*](utils_formatfilter.md#size)): *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\>[]

Filters Camera Device Formats by the best matching aspect ratio for the given `viewSize`.

**`example`** 
```js
const formats = useMemo(() => filterFormatsByAspectRatio(device.formats, CAMERA_VIEW_SIZE), [device.formats])
```

**`method`** 

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`formats` | *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\>[] | A list of formats the current device has (see {@link CameraDevice.formats})   |
`viewSize` | [*Size*](utils_formatfilter.md#size) | The size of the camera view which will be used to find the best aspect ratio. Defaults to the screen size.   |

**Returns:** *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\>[]

A list of Camera Device Formats that match the given `viewSize`' aspect ratio _as close as possible_.

Defined in: [src/utils/FormatFilter.ts:92](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/utils/FormatFilter.ts#L92)

___

### frameRateIncluded

▸ `Const`**frameRateIncluded**(`range`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>, `fps`: *number*): *boolean*

Returns `true` if the given Frame Rate Range (`range`) contains the given frame rate (`fps`)

**`example`** 
```js
// get all formats that support 60 FPS
const formatsWithHighFps = useMemo(() => device.formats.filter((f) => f.frameRateRanges.some((r) => frameRateIncluded(r, 60))), [device.formats])
```

**`method`** 

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`range` | *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\> | The range to check if the given `fps` are included in   |
`fps` | *number* | The FPS to check if the given `range` supports.   |

**Returns:** *boolean*

Defined in: [src/utils/FormatFilter.ts:137](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/utils/FormatFilter.ts#L137)

___

### isErrorWithCause

▸ `Const`**isErrorWithCause**(`error`: *unknown*): error is ErrorWithCause

#### Parameters:

Name | Type |
:------ | :------ |
`error` | *unknown* |

**Returns:** error is ErrorWithCause

Defined in: [src/CameraError.ts:127](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraError.ts#L127)

___

### parsePhysicalDeviceTypes

▸ `Const`**parsePhysicalDeviceTypes**(`physicalDeviceTypes`: [*PhysicalCameraDeviceType*](cameradevice.md#physicalcameradevicetype)[]): *ultra-wide-angle-camera* \| *wide-angle-camera* \| *telephoto-camera* \| *dual-camera* \| *dual-wide-camera* \| *triple-camera* \| *true-depth-camera*

Parses an array of physical device types into a single `PhysicalCameraDeviceType` or `LogicalCameraDeviceType`, depending what matches.

**`method`** 

#### Parameters:

Name | Type |
:------ | :------ |
`physicalDeviceTypes` | [*PhysicalCameraDeviceType*](cameradevice.md#physicalcameradevicetype)[] |

**Returns:** *ultra-wide-angle-camera* \| *wide-angle-camera* \| *telephoto-camera* \| *dual-camera* \| *dual-wide-camera* \| *triple-camera* \| *true-depth-camera*

Defined in: [src/CameraDevice.ts:26](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraDevice.ts#L26)

___

### sortDevices

▸ `Const`**sortDevices**(`left`: *Readonly*<{ `devices`: [*PhysicalCameraDeviceType*](cameradevice.md#physicalcameradevicetype)[] ; `formats`: *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\>[] ; `hasFlash`: *boolean* ; `hasTorch`: *boolean* ; `id`: *string* ; `isMultiCam`: *boolean* ; `maxZoom`: *number* ; `minZoom`: *number* ; `name`: *string* ; `neutralZoom`: *number* ; `position`: [*CameraPosition*](cameraposition.md#cameraposition) ; `supportsLowLightBoost`: *boolean*  }\>, `right`: *Readonly*<{ `devices`: [*PhysicalCameraDeviceType*](cameradevice.md#physicalcameradevicetype)[] ; `formats`: *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\>[] ; `hasFlash`: *boolean* ; `hasTorch`: *boolean* ; `id`: *string* ; `isMultiCam`: *boolean* ; `maxZoom`: *number* ; `minZoom`: *number* ; `name`: *string* ; `neutralZoom`: *number* ; `position`: [*CameraPosition*](cameraposition.md#cameraposition) ; `supportsLowLightBoost`: *boolean*  }\>): *number*

Compares two devices by the following criteria:
* `wide-angle-camera`s are ranked higher than others
* Devices with more physical cameras are ranked higher than ones with less. (e.g. "Triple Camera" > "Wide-Angle Camera")

> Note that this makes the `sort()` function descending, so the first element (`[0]`) is the "best" device.

**`example`** 
```js
const devices = camera.devices.sort(sortDevices)
const bestDevice = devices[0]
```

**`method`** 

#### Parameters:

Name | Type |
:------ | :------ |
`left` | *Readonly*<{ `devices`: [*PhysicalCameraDeviceType*](cameradevice.md#physicalcameradevicetype)[] ; `formats`: *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\>[] ; `hasFlash`: *boolean* ; `hasTorch`: *boolean* ; `id`: *string* ; `isMultiCam`: *boolean* ; `maxZoom`: *number* ; `minZoom`: *number* ; `name`: *string* ; `neutralZoom`: *number* ; `position`: [*CameraPosition*](cameraposition.md#cameraposition) ; `supportsLowLightBoost`: *boolean*  }\> |
`right` | *Readonly*<{ `devices`: [*PhysicalCameraDeviceType*](cameradevice.md#physicalcameradevicetype)[] ; `formats`: *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\>[] ; `hasFlash`: *boolean* ; `hasTorch`: *boolean* ; `id`: *string* ; `isMultiCam`: *boolean* ; `maxZoom`: *number* ; `minZoom`: *number* ; `name`: *string* ; `neutralZoom`: *number* ; `position`: [*CameraPosition*](cameraposition.md#cameraposition) ; `supportsLowLightBoost`: *boolean*  }\> |

**Returns:** *number*

Defined in: [src/utils/FormatFilter.ts:18](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/utils/FormatFilter.ts#L18)

___

### sortFormatsByResolution

▸ `Const`**sortFormatsByResolution**(`left`: *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\>, `right`: *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\>): *number*

Sorts Camera Device Formats by highest photo-capture resolution, descending. Use this in a `.sort` function.

**`example`** 
```js
const formats = useMemo(() => device.formats.sort(sortFormatsByResolution), [device.formats])
const bestFormat = formats[0]
```

**`method`** 

#### Parameters:

Name | Type |
:------ | :------ |
`left` | *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> |
`right` | *Readonly*<{ `autoFocusSystem`: [*AutoFocusSystem*](cameradevice.md#autofocussystem) ; `colorSpaces`: [*ColorSpace*](cameradevice.md#colorspace)[] ; `fieldOfView`: *number* ; `frameRateRanges`: *Readonly*<{ `maxFrameRate`: *number* ; `minFrameRate`: *number*  }\>[] ; `isHighestPhotoQualitySupported?`: *undefined* \| *boolean* ; `maxISO`: *number* ; `maxZoom`: *number* ; `minISO`: *number* ; `photoHeight`: *number* ; `photoWidth`: *number* ; `supportsPhotoHDR`: *boolean* ; `supportsVideoHDR`: *boolean* ; `videoHeight?`: *undefined* \| *number* ; `videoStabilizationModes`: [*VideoStabilizationMode*](cameradevice.md#videostabilizationmode)[] ; `videoWidth?`: *undefined* \| *number*  }\> |

**Returns:** *number*

Defined in: [src/utils/FormatFilter.ts:112](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/utils/FormatFilter.ts#L112)

___

### tryParseNativeCameraError

▸ `Const`**tryParseNativeCameraError**<T\>(`nativeError`: T): [*CameraRuntimeError*](../classes/cameraerror.cameraruntimeerror.md) \| [*CameraCaptureError*](../classes/cameraerror.cameracaptureerror.md) \| T

Tries to parse an error coming from native to a typed JS camera error.

**`method`** 

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`nativeError` | T | The native error instance. This is a JSON in the legacy native module architecture.   |

**Returns:** [*CameraRuntimeError*](../classes/cameraerror.cameraruntimeerror.md) \| [*CameraCaptureError*](../classes/cameraerror.cameracaptureerror.md) \| T

A `CameraRuntimeError` or `CameraCaptureError`, or the nativeError if it's not parsable

Defined in: [src/CameraError.ts:153](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/CameraError.ts#L153)

___

### useCameraDevices

▸ **useCameraDevices**(): CameraDevices

Gets the best available `CameraDevice`. Devices with more cameras are preferred.

**`throws`** `CameraRuntimeError` if no device was found.

**`example`** 
```jsx
const device = useCameraDevice()
// ...
return <Camera device={device} />
```

**Returns:** CameraDevices

The best matching `CameraDevice`.

Defined in: [src/hooks/useCameraDevices.ts:29](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/hooks/useCameraDevices.ts#L29)

▸ **useCameraDevices**(`deviceType`: [*PhysicalCameraDeviceType*](cameradevice.md#physicalcameradevicetype) \| [*LogicalCameraDeviceType*](cameradevice.md#logicalcameradevicetype)): CameraDevices

Gets a `CameraDevice` for the requested device type.

**`throws`** `CameraRuntimeError` if no device was found.

**`example`** 
```jsx
const device = useCameraDevice('wide-angle-camera')
// ...
return <Camera device={device} />
```

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`deviceType` | [*PhysicalCameraDeviceType*](cameradevice.md#physicalcameradevicetype) \| [*LogicalCameraDeviceType*](cameradevice.md#logicalcameradevicetype) | Specifies a device type which will be used as a device filter.   |

**Returns:** CameraDevices

A `CameraDevice` for the requested device type.

Defined in: [src/hooks/useCameraDevices.ts:44](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/hooks/useCameraDevices.ts#L44)

___

### useCameraFormat

▸ **useCameraFormat**(`device?`: [*CameraDevice*](cameradevice.md#cameradevice), `cameraViewSize?`: [*Size*](utils_formatfilter.md#size)): [*CameraDeviceFormat*](cameradevice.md#cameradeviceformat) \| *undefined*

Returns the best format for the given camera device.

This function tries to choose a format with the highest possible photo-capture resolution and best matching aspect ratio.

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`device?` | [*CameraDevice*](cameradevice.md#cameradevice) | The Camera Device   |
`cameraViewSize?` | [*Size*](utils_formatfilter.md#size) | The Camera View's size. This can be an approximation and **must be memoized**! Default: `SCREEN_SIZE`    |

**Returns:** [*CameraDeviceFormat*](cameradevice.md#cameradeviceformat) \| *undefined*

The best matching format for the given camera device, or `undefined` if the camera device is `undefined`.

Defined in: [src/hooks/useCameraFormat.ts:16](https://github.com/cuvent/react-native-vision-camera/blob/919aa3d/src/hooks/useCameraFormat.ts#L16)

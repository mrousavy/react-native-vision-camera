import React from 'react';
import { requireNativeComponent, NativeModules, ViewProps, NativeSyntheticEvent, findNodeHandle, NativeMethods, Platform } from 'react-native';
import type { CameraPhotoCodec, CameraVideoCodec } from './CameraCodec';
import type { ColorSpace, CameraDeviceFormat, CameraDevice } from './CameraDevice';
import type { ErrorWithCause } from './CameraError';
import { CameraCaptureError, CameraRuntimeError, tryParseNativeCameraError, isErrorWithCause } from './CameraError';
import type { CameraPreset } from './CameraPreset';
import type { CodeType, Code } from './Code';
import type { PhotoFile, TakePhotoOptions } from './PhotoFile';
import type { Point } from './Point';
import type { TakeSnapshotOptions } from './Snapshot';
import type { RecordVideoOptions, VideoFile } from './VideoFile';

//#region Types
export interface CameraProps extends ViewProps {
  /**
   * The Camera Device to use.
   *
   * See the [Camera Devices](https://cuvent.github.io/react-native-vision-camera/docs/devices) section in the documentation for more information about Camera Devices.
   *
   * @example
   * ```tsx
   * const devices = useCameraDevices('wide-angle-camera')
   * const device = devices.back
   *
   * return (
   *   <Camera
   *     device={device}
   *     isActive={true}
   *     style={StyleSheet.absoluteFill}
   *   />
   * )
   * ```
   */
  device: CameraDevice;
  /**
   * Whether the Camera should actively stream video frames, or not. See the [documentation about the `isActive` prop](https://cuvent.github.io/react-native-vision-camera/docs/devices#the-isactive-prop) for more information.
   *
   * This can be compared to a Video component, where `isActive` specifies whether the video is paused or not.
   *
   * > Note: If you fully unmount the `<Camera>` component instead of using `isActive={false}`, the Camera will take a bit longer to start again. In return, it will use less resources since the Camera will be completely destroyed when unmounted.
   */
  isActive: boolean;

  //#region Common Props (torch, zoom)
  /**
   * Set the current torch mode.
   *
   * Note: The torch is only available on `"back"` cameras, and isn't supported by every phone.
   *
   * @default "off"
   */
  torch?: 'off' | 'on';
  /**
   * Specifies the zoom factor of the current camera, in percent. (`0.0` - `1.0`)
   *
   * **Note:** Linearly increasing this value always appears logarithmic to the user.
   *
   * @default 0.0
   */
  zoom?: number;
  /**
   * Enables or disables the native pinch to zoom gesture.
   *
   * If you want to implement a custom zoom gesture, see [the Zooming with Reanimated documentation](https://cuvent.github.io/react-native-vision-camera/docs/animated).
   *
   * @default false
   */
  enableZoomGesture?: boolean;
  //#endregion

  //#region Format/Preset selection
  /**
   * Automatically selects a camera format which best matches the given preset. Must be `undefined` when `format` is set!
   */
  preset?: CameraPreset;
  /**
   * Selects a given format. Must be `undefined` when `preset` is set!
   */
  format?: CameraDeviceFormat;
  /**
   * Specify the frames per second this camera should use. Make sure the given `format` includes a frame rate range with the given `fps`.
   *
   * Requires `format` to be set.
   */
  fps?: number;
  /**
   * Enables or disables HDR on this camera device. Make sure the given `format` supports HDR mode.
   *
   * Requires `format` to be set.
   */
  hdr?: boolean;
  /**
   * Enables or disables low-light boost on this camera device. Make sure the given `format` supports low-light boost.
   *
   * Requires `format` to be set.
   */
  lowLightBoost?: boolean;
  /**
   * Specifies the color space to use for this camera device. Make sure the given `format` contains the given `colorSpace`.
   *
   * Requires `format` to be set.
   */
  colorSpace?: ColorSpace;
  //#endregion

  /**
   * Also captures data from depth-perception sensors. (e.g. disparity maps)
   *
   * @default false
   */
  enableDepthData?: boolean;
  /**
   * A boolean specifying whether the photo render pipeline is prepared for portrait effects matte delivery.
   *
   * When enabling this, you must also set `enableDepthData` to `true`.
   *
   * @platform iOS 12.0+
   * @default false
   */
  enablePortraitEffectsMatteDelivery?: boolean;
  /**
   * Indicates whether the photo render pipeline should be configured to deliver high resolution still images
   *
   * @default false
   */
  enableHighResolutionCapture?: boolean;

  //#region Events
  /**
   * Called when any kind of runtime error occured.
   */
  onError?: (error: CameraRuntimeError) => void;
  /**
   * Called when the camera was successfully initialized.
   */
  onInitialized?: () => void;

  // TODO: Remove once frameProcessors land
  /**
   * Specify the code types this camera can scan. Will be removed with the addition of Frame Processors.
   */
  scannableCodes?: CodeType[];
  // TODO: Remove once frameProcessors land
  /**
   * Called when one or multiple codes have been scanned. Will be removed with the addition of Frame Processors.
   */
  onCodeScanned?: (codes: Code[]) => void;
  //#endregion
}

export type CameraPermissionStatus = 'authorized' | 'not-determined' | 'denied' | 'restricted';
export type CameraPermissionRequestResult = 'authorized' | 'denied';

interface OnErrorEvent {
  code: string;
  message: string;
  cause?: ErrorWithCause;
}
interface OnCodeScannedEvent {
  codes: Code[];
}
type NativeCameraViewProps = Omit<CameraProps, 'device' | 'onInitialized' | 'onError' | 'onCodeScanned'> & {
  cameraId: string;
  onInitialized?: (event: NativeSyntheticEvent<void>) => void;
  onError?: (event: NativeSyntheticEvent<OnErrorEvent>) => void;
  onCodeScanned?: (event: NativeSyntheticEvent<OnCodeScannedEvent>) => void;
};
type RefType = React.Component<NativeCameraViewProps> & Readonly<NativeMethods>;

//#endregion

// NativeModules automatically resolves 'CameraView' to 'CameraViewModule'
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const CameraModule = NativeModules.CameraView;
if (CameraModule == null) console.error("Camera: Native Module 'CameraView' was null! Did you run pod install?");

interface CameraState {
  /**
   * The actual native ID for the camera device.
   */
  cameraId?: string;
}

/**
 * ### A powerful `<Camera>` component.
 *
 * Read the [VisionCamera documentation](https://cuvent.github.io/react-native-vision-camera/) for more information.
 *
 * The `<Camera>` component's most important (and therefore _required_) properties are:
 *
 * * {@linkcode CameraProps.device | device}: Specifies the {@linkcode CameraDevice} to use. Get a {@linkcode CameraDevice} by using the {@linkcode useCameraDevices | useCameraDevices()} hook, or manually by using the {@linkcode Camera.getAvailableCameraDevices Camera.getAvailableCameraDevices()} function.
 * * {@linkcode CameraProps.isActive | isActive}: A boolean value that specifies whether the Camera should actively stream video frames or not. This can be compared to a Video component, where `isActive` specifies whether the video is paused or not. If you fully unmount the `<Camera>` component instead of using `isActive={false}`, the Camera will take a bit longer to start again.
 *
 * @example
 * ```tsx
 * function App() {
 *   const devices = useCameraDevices('wide-angle-camera')
 *   const device = devices.back
 *
 *   if (device == null) return <LoadingView />
 *   return (
 *     <Camera
 *       style={StyleSheet.absoluteFill}
 *       device={device}
 *       isActive={true}
 *     />
 *   )
 * }
 * ```
 *
 * @component
 */
export class Camera extends React.PureComponent<CameraProps, CameraState> {
  /**
   * @internal
   */
  static displayName = 'Camera';
  /**
   * @internal
   */
  displayName = Camera.displayName;

  private readonly ref: React.RefObject<RefType>;

  /**
   * @internal
   */
  constructor(props: CameraProps) {
    super(props);
    this.state = { cameraId: undefined };
    this.onInitialized = this.onInitialized.bind(this);
    this.onError = this.onError.bind(this);
    this.onCodeScanned = this.onCodeScanned.bind(this);
    this.ref = React.createRef<RefType>();
  }

  private get handle(): number | null {
    const nodeHandle = findNodeHandle(this.ref.current);
    if (nodeHandle == null) console.error('Camera: findNodeHandle(ref) returned null! Does the Camera view exist in the native view tree?');

    return nodeHandle;
  }

  //#region View-specific functions (UIViewManager)
  /**
   * Take a single photo and write it's content to a temporary file.
   *
   * @throws {@linkcode CameraCaptureError} When any kind of error occured while capturing the photo. Use the {@linkcode CameraCaptureError.code | code} property to get the actual error
   * @example
   * ```ts
   * const photo = await camera.current.takePhoto({
   *   qualityPrioritization: 'quality',
   *   flash: 'on',
   *   enableAutoRedEyeReduction: true
   * })
   * ```
   */
  public async takePhoto(options?: TakePhotoOptions): Promise<PhotoFile> {
    try {
      return await CameraModule.takePhoto(this.handle, options ?? {});
    } catch (e) {
      throw tryParseNativeCameraError(e);
    }
  }

  /**
   * Take a snapshot of the current preview view.
   *
   * This can be used as an alternative to {@linkcode Camera.takePhoto | takePhoto()} if speed is more important than quality
   *
   * @throws {@linkcode CameraCaptureError} When any kind of error occured while taking a snapshot. Use the {@linkcode CameraCaptureError.code | code} property to get the actual error
   *
   * @platform Android
   * @example
   * ```ts
   * const photo = await camera.current.takeSnapshot({
   *   quality: 85,
   *   skipMetadata: true
   * })
   * ```
   */
  public async takeSnapshot(options?: TakeSnapshotOptions): Promise<PhotoFile> {
    if (Platform.OS !== 'android')
      throw new CameraCaptureError('capture/capture-type-not-supported', `'takeSnapshot()' is not available on ${Platform.OS}!`);

    try {
      return await CameraModule.takeSnapshot(this.handle, options ?? {});
    } catch (e) {
      throw tryParseNativeCameraError(e);
    }
  }

  /**
   * Start a new video recording.
   *
   * Records in the following formats:
   * * **iOS**: QuickTime (`.mov`)
   * * **Android**: MPEG4 (`.mp4`)
   *
   * @blocking This function is synchronized/blocking.
   *
   * @throws {@linkcode CameraCaptureError} When any kind of error occured while starting the video recording. Use the {@linkcode CameraCaptureError.code | code} property to get the actual error
   *
   * @example
   * ```ts
   * camera.current.startRecording({
   *   onRecordingFinished: (video) => console.log(video),
   *   onRecordingError: (error) => console.error(error),
   * })
   * setTimeout(() => {
   *   camera.current.stopRecording()
   * }, 5000)
   * ```
   */
  public startRecording(options: RecordVideoOptions): void {
    const { onRecordingError, onRecordingFinished, ...passThroughOptions } = options;
    if (typeof onRecordingError !== 'function' || typeof onRecordingFinished !== 'function')
      throw new CameraRuntimeError('parameter/invalid-parameter', 'The onRecordingError or onRecordingFinished functions were not set!');

    const onRecordCallback = (video?: VideoFile, error?: CameraCaptureError): void => {
      if (error != null) return onRecordingError(error);
      if (video != null) return onRecordingFinished(video);
    };
    // TODO: Use TurboModules to either make this a sync invokation, or make it async.
    try {
      CameraModule.startRecording(this.handle, passThroughOptions, onRecordCallback);
    } catch (e) {
      throw tryParseNativeCameraError(e);
    }
  }
  /**
   * Stop the current video recording.
   *
   * @throws {@linkcode CameraCaptureError} When any kind of error occured while stopping the video recording. Use the {@linkcode CameraCaptureError.code | code} property to get the actual error
   *
   * @example
   * ```ts
   * await camera.current.startRecording()
   * setTimeout(async () => {
   *  const video = await camera.current.stopRecording()
   * }, 5000)
   * ```
   */
  public async stopRecording(): Promise<void> {
    try {
      return await CameraModule.stopRecording(this.handle);
    } catch (e) {
      throw tryParseNativeCameraError(e);
    }
  }

  /**
   * Focus the camera to a specific point in the coordinate system.
   * @param {Point} point The point to focus to. This should be relative to the Camera view's coordinate system,
   * and expressed in Pixel on iOS and Points on Android.
   *  * `(0, 0)` means **top left**.
   *  * `(CameraView.width, CameraView.height)` means **bottom right**.
   *
   * Make sure the value doesn't exceed the CameraView's dimensions.
   *
   * @throws {@linkcode CameraRuntimeError} When any kind of error occured while focussing. Use the {@linkcode CameraRuntimeError.code | code} property to get the actual error
   * @example
   * ```ts
   * await camera.current.focus({
   *   x: tapEvent.x,
   *   y: tapEvent.y
   * })
   * ```
   */
  public async focus(point: Point): Promise<void> {
    try {
      return await CameraModule.focus(this.handle, point);
    } catch (e) {
      throw tryParseNativeCameraError(e);
    }
  }

  /**
   * Get a list of video codecs the current camera supports.  Returned values are ordered by efficiency (descending).
   *
   * This function can only be called after the camera has been initialized,
   * so only use this after the {@linkcode onInitialized | onInitialized()} event has fired.
   *
   * @platform iOS
   * @throws {@linkcode CameraRuntimeError} When any kind of error occured while getting available video codecs. Use the {@linkcode CameraRuntimeError.code | code} property to get the actual error
   */
  public async getAvailableVideoCodecs(): Promise<CameraVideoCodec[]> {
    try {
      return await CameraModule.getAvailableVideoCodecs(this.handle);
    } catch (e) {
      throw tryParseNativeCameraError(e);
    }
  }
  /**
   * Get a list of photo codecs the current camera supports. Returned values are ordered by efficiency (descending).
   *
   * This function can only be called after the camera has been initialized,
   * so only use this after the {@linkcode onInitialized | onInitialized()} event has fired.
   *
   * @platform iOS
   * @throws {@linkcode CameraRuntimeError} When any kind of error occured while getting available photo codecs. Use the {@linkcode CameraRuntimeError.code | code} property to get the actual error
   */
  public async getAvailablePhotoCodecs(): Promise<CameraPhotoCodec[]> {
    try {
      return await CameraModule.getAvailablePhotoCodecs(this.handle);
    } catch (e) {
      throw tryParseNativeCameraError(e);
    }
  }
  //#endregion

  //#region Static Functions (NativeModule)
  /**
   * Get a list of all available camera devices on the current phone.
   *
   * @throws {@linkcode CameraRuntimeError} When any kind of error occured while getting all available camera devices. Use the {@linkcode CameraRuntimeError.code | code} property to get the actual error
   * @example
   * ```ts
   * const devices = await Camera.getAvailableCameraDevices()
   * const filtered = devices.filter((d) => matchesMyExpectations(d))
   * const sorted = devices.sort(sortDevicesByAmountOfCameras)
   * return {
   *   back: sorted.find((d) => d.position === "back"),
   *   front: sorted.find((d) => d.position === "front")
   * }
   * ```
   */
  public static async getAvailableCameraDevices(): Promise<CameraDevice[]> {
    try {
      return await CameraModule.getAvailableCameraDevices();
    } catch (e) {
      throw tryParseNativeCameraError(e);
    }
  }
  /**
   * Gets the current Camera Permission Status. Check this before mounting the Camera to ensure
   * the user has permitted the app to use the camera.
   *
   * To actually prompt the user for camera permission, use {@linkcode Camera.requestCameraPermission | requestCameraPermission()}.
   *
   * @throws {@linkcode CameraRuntimeError} When any kind of error occured while getting the current permission status. Use the {@linkcode CameraRuntimeError.code | code} property to get the actual error
   */
  public static async getCameraPermissionStatus(): Promise<CameraPermissionStatus> {
    try {
      return await CameraModule.getCameraPermissionStatus();
    } catch (e) {
      throw tryParseNativeCameraError(e);
    }
  }
  /**
   * Gets the current Microphone-Recording Permission Status. Check this before mounting the Camera to ensure
   * the user has permitted the app to use the microphone.
   *
   * To actually prompt the user for microphone permission, use {@linkcode Camera.requestMicrophonePermission | requestMicrophonePermission()}.
   *
   * @throws {@linkcode CameraRuntimeError} When any kind of error occured while getting the current permission status. Use the {@linkcode CameraRuntimeError.code | code} property to get the actual error
   */
  public static async getMicrophonePermissionStatus(): Promise<CameraPermissionStatus> {
    try {
      return await CameraModule.getMicrophonePermissionStatus();
    } catch (e) {
      throw tryParseNativeCameraError(e);
    }
  }
  /**
   * Shows a "request permission" alert to the user, and resolves with the new camera permission status.
   *
   * If the user has previously blocked the app from using the camera, the alert will not be shown
   * and `"denied"` will be returned.
   *
   * @throws {@linkcode CameraRuntimeError} When any kind of error occured while requesting permission. Use the {@linkcode CameraRuntimeError.code | code} property to get the actual error
   */
  public static async requestCameraPermission(): Promise<CameraPermissionRequestResult> {
    try {
      return await CameraModule.requestCameraPermission();
    } catch (e) {
      throw tryParseNativeCameraError(e);
    }
  }
  /**
   * Shows a "request permission" alert to the user, and resolves with the new microphone permission status.
   *
   * If the user has previously blocked the app from using the microphone, the alert will not be shown
   * and `"denied"` will be returned.
   *
   * @throws {@linkcode CameraRuntimeError} When any kind of error occured while requesting permission. Use the {@linkcode CameraRuntimeError.code | code} property to get the actual error
   */
  public static async requestMicrophonePermission(): Promise<CameraPermissionRequestResult> {
    try {
      return await CameraModule.requestMicrophonePermission();
    } catch (e) {
      throw tryParseNativeCameraError(e);
    }
  }
  //#endregion

  //#region Events (Wrapped to maintain reference equality)
  private onError(event: NativeSyntheticEvent<OnErrorEvent>): void {
    if (event == null) throw new Error('onError() was invoked but event was null!');

    if (this.props.onError != null) {
      const error = event.nativeEvent;
      const cause = isErrorWithCause(error.cause) ? error.cause : undefined;
      this.props.onError(
        // @ts-expect-error We're casting from unknown bridge types to TS unions, I expect it to hopefully work
        new CameraRuntimeError(error.code, error.message, cause),
      );
    }
  }

  private onInitialized(): void {
    this.props.onInitialized?.();
  }

  private onCodeScanned(event: NativeSyntheticEvent<OnCodeScannedEvent>): void {
    if (event == null) throw new Error('onCodeScanned() was invoked but event was null!');

    if (this.props.onCodeScanned == null)
      console.warn('Camera: onCodeScanned event was invoked but no listeners attached! Did you forget to remove the `scannableCodes` property?');
    else this.props.onCodeScanned(event.nativeEvent.codes);
  }
  //#endregion

  /**
   * @internal
   */
  static getDerivedStateFromProps(props: CameraProps, state: CameraState): CameraState | null {
    const newCameraId = props.device.id;
    if (state.cameraId !== newCameraId) return { ...state, cameraId: newCameraId };

    return null;
  }

  /**
   * @internal
   */
  public render(): React.ReactNode {
    if (this.state.cameraId == null) throw new Error('CameraId was null! Did you pass a valid `device`?');

    // We remove the big `device` object from the props because we only need to pass `cameraId` to native.
    const { device: _, ...props } = this.props;
    return (
      <NativeCameraView
        {...props}
        cameraId={this.state.cameraId}
        ref={this.ref}
        onInitialized={this.onInitialized}
        onError={this.onError}
        onCodeScanned={this.onCodeScanned}
      />
    );
  }
}

// requireNativeComponent automatically resolves 'CameraView' to 'CameraViewManager'
const NativeCameraView = requireNativeComponent<NativeCameraViewProps>(
  'CameraView',
  // @ts-expect-error because the type declarations are kinda wrong, no?
  Camera,
);

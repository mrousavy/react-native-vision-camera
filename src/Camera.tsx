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
type Modify<T, R> = Omit<T, keyof R> & R;

type CameraFormatProps = {
  /**
   * Automatically selects a camera format which best matches the given preset
   */
  preset?: CameraPreset;
  /**
   * Specify the frames per second this camera should use. Make sure the given `format` includes a frame rate range with the given `fps`.
   */
  fps?: never;
  /**
   * Enables or disables HDR on this camera device. Make sure the given `format` supports HDR mode.
   */
  hdr?: never;
  /**
   * Enables or disables low-light boost on this camera device. Make sure the given `format` supports low-light boost.
   */
  lowLightBoost?: never;
  /**
   * Specifies the color space to use for this camera device. Make sure the given `format` contains the given `colorSpace`.
   */
  colorSpace?: never;
  /**
   * Selects a given format.
   */
  format?: never;
};
type CameraPresetProps = Modify<
  CameraFormatProps,
  {
    preset?: never;
    fps?: number;
    hdr?: boolean;
    lowLightBoost?: boolean;
    colorSpace?: ColorSpace;
    format?: CameraDeviceFormat;
  }
>;

type CameraScannerPropsNever = {
  /**
   * Specify the code types this camera can scan.
   */
  scannableCodes?: never;
  /**
   * Called when one or multiple codes have been scanned.
   */
  onCodeScanned?: never;
};
export type CameraScannerProps = Modify<
  CameraScannerPropsNever,
  {
    scannableCodes: CodeType[];
    onCodeScanned: (codes: Code[]) => void;
  }
>;

export type CameraDeviceProps = {
  // Properties
  /**
   * The Camera Device to use
   */
  device: CameraDevice;
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
};

export type CameraDynamicProps = {
  /**
   * Whether the Camera should actively stream video frames, or not.
   *
   * This can be compared to a Video component, where `isActive` specifies whether the video is paused or not.
   *
   * > Note: If you fully unmount the `<Camera>` component instead of using `isActive={false}`, the Camera will take a bit longer to start again. In return, it will use less resources since the Camera will be completely destroyed when unmounted.
   */
  isActive: boolean;
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
   * @default 0.0
   */
  zoom?: number;
  /**
   * Enables or disables the pinch to zoom gesture
   *
   * @default false
   */
  enableZoomGesture?: boolean;
};

export type CameraEventProps = {
  /**
   * Called when any kind of runtime error occured.
   */
  onError?: (error: CameraRuntimeError) => void;
  /**
   * Called when the camera was successfully initialized.
   */
  onInitialized?: () => void;
};

export type CameraProps = (CameraPresetProps | CameraFormatProps) &
  (CameraScannerPropsNever | CameraScannerProps) &
  CameraDeviceProps &
  CameraDynamicProps &
  CameraEventProps &
  ViewProps;

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

type RefType = React.Component<CameraProps> & Readonly<NativeMethods>;

/**
 * ### A powerful `<Camera>` component.
 *
 * The `<Camera>` component's most important (and therefore _required_) properties are:
 *
 * * `device`: Specifies the {@link CameraDevice} to use. Get a {@link CameraDevice} by using the {@link useCameraDevices} hook, or manually by using the {@link Camera.getAvailableCameraDevices} function.
 * * `isActive`: A boolean value that specifies whether the Camera should actively stream video frames or not. This can be compared to a Video component, where `isActive` specifies whether the video is paused or not. If you fully unmount the `<Camera>` component instead of using `isActive={false}`, the Camera will take a bit longer to start again.
 *
 * @example
 * ```jsx
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
   * @throws {@link CameraCaptureError} When any kind of error occured. Use the `CameraCaptureError.code` property to get the actual error
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
   * This can be used as an alternative to `takePhoto()` if speed is more important than quality
   *
   * @platform Android
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
   * @throws {@link CameraCaptureError} When any kind of error occured. Use the `CameraCaptureError.code` property to get the actual error
   *
   * @example
   * ```js
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
   * @example
   * ```js
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
   * so only use this after the `onInitialized` event has fired.
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
   * so only use this after the `onInitialized` event has fired.
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
   * To actually prompt the user for camera permission, use `Camera.requestCameraPermission()`.
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
   * To actually prompt the user for microphone permission, use `Camera.requestMicrophonePermission()`.
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
  private onError(event?: NativeSyntheticEvent<OnErrorEvent>): void {
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

  private onCodeScanned(event?: NativeSyntheticEvent<OnCodeScannedEvent>): void {
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
    // We remove the big `device` object from the props because we only need to pass `cameraId` to native.
    const { device: _, ...props } = this.props;
    return (
      <NativeCameraView
        {...props}
        cameraId={this.state.cameraId}
        ref={this.ref}
        onInitialized={this.onInitialized}
        // @ts-expect-error with our callback wrapping we have to extract NativeSyntheticEvent params
        onError={this.onError}
        // @ts-expect-error with our callback wrapping we have to extract NativeSyntheticEvent params
        onCodeScanned={this.onCodeScanned}
      />
    );
  }
}

// requireNativeComponent automatically resolves 'CameraView' to 'CameraViewManager'
const NativeCameraView = requireNativeComponent<CameraProps>(
  'CameraView',
  // @ts-expect-error because the type declarations are kinda wrong, no?
  Camera,
);

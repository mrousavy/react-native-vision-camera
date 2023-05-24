import React from 'react';
import type { VideoFileType } from '.';
import type { CameraDevice } from './CameraDevice';
import type { CameraProps } from './CameraProps';
import type { PhotoFile, TakePhotoOptions } from './PhotoFile';
import type { Point } from './Point';
import type { TakeSnapshotOptions } from './Snapshot';
import type { CameraVideoCodec, RecordVideoOptions } from './VideoFile';
export declare type CameraPermissionStatus = 'authorized' | 'not-determined' | 'denied' | 'restricted';
export declare type CameraPermissionRequestResult = 'authorized' | 'denied';
/**
 * ### A powerful `<Camera>` component.
 *
 * Read the [VisionCamera documentation](https://mrousavy.github.io/react-native-vision-camera/) for more information.
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
export declare class Camera extends React.PureComponent<CameraProps> {
    /** @internal */
    static displayName: string;
    /** @internal */
    displayName: string;
    private lastFrameProcessor;
    private isNativeViewMounted;
    private readonly ref;
    /** @internal */
    constructor(props: CameraProps);
    private get handle();
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
    takePhoto(options?: TakePhotoOptions): Promise<PhotoFile>;
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
    takeSnapshot(options?: TakeSnapshotOptions): Promise<PhotoFile>;
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
    startRecording(options: RecordVideoOptions): void;
    /**
     * Pauses the current video recording.
     *
     * @throws {@linkcode CameraCaptureError} When any kind of error occured while pausing the video recording. Use the {@linkcode CameraCaptureError.code | code} property to get the actual error
     *
     * @example
     * ```ts
     * // Start
     * await camera.current.startRecording()
     * await timeout(1000)
     * // Pause
     * await camera.current.pauseRecording()
     * await timeout(500)
     * // Resume
     * await camera.current.resumeRecording()
     * await timeout(2000)
     * // Stop
     * const video = await camera.current.stopRecording()
     * ```
     */
    pauseRecording(): Promise<void>;
    /**
     * Resumes a currently paused video recording.
     *
     * @throws {@linkcode CameraCaptureError} When any kind of error occured while resuming the video recording. Use the {@linkcode CameraCaptureError.code | code} property to get the actual error
     *
     * @example
     * ```ts
     * // Start
     * await camera.current.startRecording()
     * await timeout(1000)
     * // Pause
     * await camera.current.pauseRecording()
     * await timeout(500)
     * // Resume
     * await camera.current.resumeRecording()
     * await timeout(2000)
     * // Stop
     * const video = await camera.current.stopRecording()
     * ```
     */
    resumeRecording(): Promise<void>;
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
    stopRecording(): Promise<void>;
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
    focus(point: Point): Promise<void>;
    /**
     * Get a list of video codecs the current camera supports for a given file type.  Returned values are ordered by efficiency (descending).
     * @example
     * ```ts
     * const codecs = await camera.current.getAvailableVideoCodecs("mp4")
     * ```
     * @throws {@linkcode CameraRuntimeError} When any kind of error occured while getting available video codecs. Use the {@linkcode ParameterError.code | code} property to get the actual error
     * @platform iOS
     */
    getAvailableVideoCodecs(fileType?: VideoFileType): Promise<CameraVideoCodec[]>;
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
    static getAvailableCameraDevices(): Promise<CameraDevice[]>;
    /**
     * Gets the current Camera Permission Status. Check this before mounting the Camera to ensure
     * the user has permitted the app to use the camera.
     *
     * To actually prompt the user for camera permission, use {@linkcode Camera.requestCameraPermission | requestCameraPermission()}.
     *
     * @throws {@linkcode CameraRuntimeError} When any kind of error occured while getting the current permission status. Use the {@linkcode CameraRuntimeError.code | code} property to get the actual error
     */
    static getCameraPermissionStatus(): Promise<CameraPermissionStatus>;
    /**
     * Gets the current Microphone-Recording Permission Status. Check this before mounting the Camera to ensure
     * the user has permitted the app to use the microphone.
     *
     * To actually prompt the user for microphone permission, use {@linkcode Camera.requestMicrophonePermission | requestMicrophonePermission()}.
     *
     * @throws {@linkcode CameraRuntimeError} When any kind of error occured while getting the current permission status. Use the {@linkcode CameraRuntimeError.code | code} property to get the actual error
     */
    static getMicrophonePermissionStatus(): Promise<CameraPermissionStatus>;
    /**
     * Shows a "request permission" alert to the user, and resolves with the new camera permission status.
     *
     * If the user has previously blocked the app from using the camera, the alert will not be shown
     * and `"denied"` will be returned.
     *
     * @throws {@linkcode CameraRuntimeError} When any kind of error occured while requesting permission. Use the {@linkcode CameraRuntimeError.code | code} property to get the actual error
     */
    static requestCameraPermission(): Promise<CameraPermissionRequestResult>;
    /**
     * Shows a "request permission" alert to the user, and resolves with the new microphone permission status.
     *
     * If the user has previously blocked the app from using the microphone, the alert will not be shown
     * and `"denied"` will be returned.
     *
     * @throws {@linkcode CameraRuntimeError} When any kind of error occured while requesting permission. Use the {@linkcode CameraRuntimeError.code | code} property to get the actual error
     */
    static requestMicrophonePermission(): Promise<CameraPermissionRequestResult>;
    private onError;
    private onInitialized;
    private onFrameProcessorPerformanceSuggestionAvailable;
    /** @internal */
    private assertFrameProcessorsEnabled;
    private setFrameProcessor;
    private unsetFrameProcessor;
    private onViewReady;
    /** @internal */
    componentDidUpdate(): void;
    /** @internal */
    render(): React.ReactNode;
}

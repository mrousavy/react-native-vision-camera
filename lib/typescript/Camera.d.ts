import React from 'react';
import type { CameraDevice } from './types/CameraDevice';
import type { CameraProps } from './types/CameraProps';
import type { PhotoFile, TakePhotoOptions } from './types/PhotoFile';
import type { Point } from './types/Point';
import type { RecordVideoOptions } from './types/VideoFile';
import type { EmitterSubscription } from 'react-native';
import type { TakeSnapshotOptions } from './types/Snapshot';
export type CameraPermissionStatus = 'granted' | 'not-determined' | 'denied' | 'restricted';
export type CameraPermissionRequestResult = 'granted' | 'denied';
interface CameraState {
    isRecordingWithFlash: boolean;
    averageFpsSamples: number[];
}
/**
 * ### A powerful `<Camera>` component.
 *
 * Read the [VisionCamera documentation](https://react-native-vision-camera.com/) for more information.
 *
 * The `<Camera>` component's most important properties are:
 *
 * * {@linkcode CameraProps.device | device}: Specifies the {@linkcode CameraDevice} to use. Get a {@linkcode CameraDevice} by using
 * the {@linkcode useCameraDevice | useCameraDevice(..)} hook, or manually by using
 * the {@linkcode CameraDevices.getAvailableCameraDevices | CameraDevices.getAvailableCameraDevices()} function.
 * * {@linkcode CameraProps.isActive | isActive}: A boolean value that specifies whether the Camera should
 * actively stream video frames or not. This can be compared to a Video component, where `isActive` specifies whether the video
 * is paused or not. If you fully unmount the `<Camera>` component instead of using `isActive={false}`, the Camera will take a bit longer to start again.
 *
 * @example
 * ```tsx
 * function App() {
 *   const device = useCameraDevice('back')
 *
 *   if (device == null) return <NoCameraErrorView />
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
export declare class Camera extends React.PureComponent<CameraProps, CameraState> {
    /** @internal */
    static displayName: string;
    /** @internal */
    displayName: string;
    private lastFrameProcessor;
    private isNativeViewMounted;
    private lastUIRotation;
    private rotationHelper;
    private readonly ref;
    /** @internal */
    constructor(props: CameraProps);
    private get handle();
    /**
     * Take a single photo and write it's content to a temporary file.
     *
     * @throws {@linkcode CameraCaptureError} When any kind of error occured while capturing the photo.
     * Use the {@linkcode CameraCaptureError.code | code} property to get the actual error
     * @example
     * ```ts
     * const photo = await camera.current.takePhoto({
     *   flash: 'on',
     *   enableAutoRedEyeReduction: true
     * })
     * ```
     */
    takePhoto(options?: TakePhotoOptions): Promise<PhotoFile>;
    /**
     * Captures a snapshot of the Camera view and write it's content to a temporary file.
     *
     * - On iOS, `takeSnapshot` waits for a Frame from the video pipeline and therefore requires `video` to be enabled.
     * - On Android, `takeSnapshot` performs a GPU view screenshot from the preview view.
     *
     * @throws {@linkcode CameraCaptureError} When any kind of error occured while capturing the photo.
     * Use the {@linkcode CameraCaptureError.code | code} property to get the actual error
     * @example
     * ```ts
     * const snapshot = await camera.current.takeSnapshot({
     *   quality: 100
     * })
     * ```
     */
    takeSnapshot(options?: TakeSnapshotOptions): Promise<PhotoFile>;
    private getBitRateMultiplier;
    /**
     * Start a new video recording.
     *
     * @throws {@linkcode CameraCaptureError} When any kind of error occured while starting the video recording.
     * Use the {@linkcode CameraCaptureError.code | code} property to get the actual error
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
     * @throws {@linkcode CameraCaptureError} When any kind of error occured while pausing the video recording.
     * Use the {@linkcode CameraCaptureError.code | code} property to get the actual error
     *
     * @example
     * ```ts
     * // Start
     * await camera.current.startRecording({
     *   onRecordingFinished: (video) => console.log(video),
     *   onRecordingError: (error) => console.error(error),
     * })
     * await timeout(1000)
     * // Pause
     * await camera.current.pauseRecording()
     * await timeout(500)
     * // Resume
     * await camera.current.resumeRecording()
     * await timeout(2000)
     * // Stop
     * await camera.current.stopRecording()
     * ```
     */
    pauseRecording(): Promise<void>;
    /**
     * Resumes a currently paused video recording.
     *
     * @throws {@linkcode CameraCaptureError} When any kind of error occured while resuming the video recording.
     * Use the {@linkcode CameraCaptureError.code | code} property to get the actual error
     *
     * @example
     * ```ts
     * // Start
     * await camera.current.startRecording({
     *   onRecordingFinished: (video) => console.log(video),
     *   onRecordingError: (error) => console.error(error),
     * })
     * await timeout(1000)
     * // Pause
     * await camera.current.pauseRecording()
     * await timeout(500)
     * // Resume
     * await camera.current.resumeRecording()
     * await timeout(2000)
     * // Stop
     * await camera.current.stopRecording()
     * ```
     */
    resumeRecording(): Promise<void>;
    /**
     * Stop the current video recording.
     *
     * @throws {@linkcode CameraCaptureError} When any kind of error occured while stopping the video recording.
     * Use the {@linkcode CameraCaptureError.code | code} property to get the actual error
     *
     * @example
     * ```ts
     * await camera.current.startRecording({
     *   onRecordingFinished: (video) => console.log(video),
     *   onRecordingError: (error) => console.error(error),
     * })
     * setTimeout(async () => {
     *   await camera.current.stopRecording()
     * }, 5000)
     * ```
     */
    stopRecording(): Promise<void>;
    /**
     * Cancel the current video recording. The temporary video file will be deleted,
     * and the `startRecording`'s `onRecordingError` callback will be invoked with a `capture/recording-canceled` error.
     *
     * @throws {@linkcode CameraCaptureError} When any kind of error occured while canceling the video recording.
     * Use the {@linkcode CameraCaptureError.code | code} property to get the actual error
     *
     * @example
     * ```ts
     * await camera.current.startRecording({
     *   onRecordingFinished: (video) => console.log(video),
     *   onRecordingError: (error) => {
     *     if (error.code === 'capture/recording-canceled') {
     *       // recording was canceled.
     *     } else {
     *       console.error(error)
     *     }
     *   },
     * })
     * setTimeout(async () => {
     *   await camera.current.cancelRecording()
     * }, 5000)
     * ```
     */
    cancelRecording(): Promise<void>;
    /**
     * Focus the camera to a specific point in the coordinate system.
     * @param {Point} point The point to focus to. This should be relative
     * to the Camera view's coordinate system and is expressed in points.
     *  * `(0, 0)` means **top left**.
     *  * `(CameraView.width, CameraView.height)` means **bottom right**.
     *
     * Make sure the value doesn't exceed the CameraView's dimensions.
     *
     * @throws {@linkcode CameraRuntimeError} When any kind of error occured while focussing.
     * Use the {@linkcode CameraRuntimeError.code | code} property to get the actual error
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
     * Get a list of all available camera devices on the current phone.
     *
     * If you use Hooks, use the `useCameraDevices(..)` hook instead.
     *
     * * For Camera Devices attached to the phone, it is safe to assume that this will never change.
     * * For external Camera Devices (USB cameras, Mac continuity cameras, etc.) the available Camera Devices
     * could change over time when the external Camera device gets plugged in or plugged out, so
     * use {@link addCameraDevicesChangedListener | addCameraDevicesChangedListener(...)} to listen for such changes.
     *
     * @example
     * ```ts
     * const devices = Camera.getAvailableCameraDevices()
     * const backCameras = devices.filter((d) => d.position === "back")
     * const frontCameras = devices.filter((d) => d.position === "front")
     * ```
     */
    static getAvailableCameraDevices(): CameraDevice[];
    /**
     * Adds a listener that gets called everytime the Camera Devices change, for example
     * when an external Camera Device (USB or continuity Camera) gets plugged in or plugged out.
     *
     * If you use Hooks, use the `useCameraDevices()` hook instead.
     */
    static addCameraDevicesChangedListener(listener: (newDevices: CameraDevice[]) => void): EmitterSubscription;
    /**
     * Gets the current Camera Permission Status. Check this before mounting the Camera to ensure
     * the user has permitted the app to use the camera.
     *
     * To actually prompt the user for camera permission, use {@linkcode Camera.requestCameraPermission | requestCameraPermission()}.
     */
    static getCameraPermissionStatus(): CameraPermissionStatus;
    /**
     * Gets the current Microphone-Recording Permission Status.
     * Check this before enabling the `audio={...}` property to make sure the
     * user has permitted the app to use the microphone.
     *
     * To actually prompt the user for microphone permission, use {@linkcode Camera.requestMicrophonePermission | requestMicrophonePermission()}.
     */
    static getMicrophonePermissionStatus(): CameraPermissionStatus;
    /**
     * Gets the current Location Permission Status.
     * Check this before enabling the `location={...}` property to make sure the
     * the user has permitted the app to use the location.
     *
     * To actually prompt the user for location permission, use {@linkcode Camera.requestLocationPermission | requestLocationPermission()}.
     *
     * Note: This method will throw a `system/location-not-enabled` error if the Location APIs are not enabled at build-time.
     * See [the "GPS Location Tags" documentation](https://react-native-vision-camera.com/docs/guides/location) for more information.
     */
    static getLocationPermissionStatus(): CameraPermissionStatus;
    /**
     * Shows a "request permission" alert to the user, and resolves with the new camera permission status.
     *
     * If the user has previously blocked the app from using the camera, the alert will not be shown
     * and `"denied"` will be returned.
     *
     * @throws {@linkcode CameraRuntimeError} When any kind of error occured while requesting permission.
     * Use the {@linkcode CameraRuntimeError.code | code} property to get the actual error
     */
    static requestCameraPermission(): Promise<CameraPermissionRequestResult>;
    /**
     * Shows a "request permission" alert to the user, and resolves with the new microphone permission status.
     *
     * If the user has previously blocked the app from using the microphone, the alert will not be shown
     * and `"denied"` will be returned.
     *
     * @throws {@linkcode CameraRuntimeError} When any kind of error occured while requesting permission.
     * Use the {@linkcode CameraRuntimeError.code | code} property to get the actual error
     */
    static requestMicrophonePermission(): Promise<CameraPermissionRequestResult>;
    /**
     * Shows a "request permission" alert to the user, and resolves with the new location permission status.
     *
     * If the user has previously blocked the app from using the location, the alert will not be shown
     * and `"denied"` will be returned.
     *
     * @throws {@linkcode CameraRuntimeError} When any kind of error occured while requesting permission.
     * Use the {@linkcode CameraRuntimeError.code | code} property to get the actual error
     */
    static requestLocationPermission(): Promise<CameraPermissionRequestResult>;
    private onError;
    private onInitialized;
    private onStarted;
    private onStopped;
    private onPreviewStarted;
    private onPreviewStopped;
    private onShutter;
    private onOutputOrientationChanged;
    private onPreviewOrientationChanged;
    private maybeUpdateUIRotation;
    private onCodeScanned;
    private setFrameProcessor;
    private unsetFrameProcessor;
    private onViewReady;
    private onAverageFpsChanged;
    /** @internal */
    componentDidUpdate(): void;
    /** @internal */
    render(): React.ReactNode;
}
export {};
//# sourceMappingURL=Camera.d.ts.map
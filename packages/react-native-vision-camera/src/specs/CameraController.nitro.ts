import type { HybridObject } from 'react-native-nitro-modules'
import type { useCamera } from '../hooks/useCamera'
import type { ExposureMode } from './common-types/ExposureMode'
import type { FocusMode } from './common-types/FocusMode'
import type {
  FocusOptions,
  MeteringMode,
  SceneAdaptiveness,
} from './common-types/FocusOptions'
import type { ListenerSubscription } from './common-types/ListenerSubscription'
import type { TorchMode } from './common-types/TorchMode'
import type { WhiteBalanceGains } from './common-types/WhiteBalanceGains'
import type { WhiteBalanceMode } from './common-types/WhiteBalanceMode'
import type { WhiteBalanceTemperatureAndTint } from './common-types/WhiteBalanceTemperatureAndTint'
import type { CameraDevice } from './inputs/CameraDevice.nitro'
import type { MeteringPoint } from './metering/MeteringPoint.nitro'
import type { CameraSession } from './session/CameraSession.nitro'

/**
 * Specifies options to use for configuring a {@linkcode CameraController}
 * via {@linkcode CameraController | configure(...)}.
 *
 * Like a diff-map, setting a value inside the {@linkcode CameraControllerConfiguration}
 * object to `undefined`, causes the prop to be left at whatever
 * its current value is.
 */
export interface CameraControllerConfiguration {
  // pragma MARK: Low Light Boost
  /**
   * Low light boost allows the Camera pipeline to automatically
   * extend exposure times (and effectively drop frame rate) to
   * receive more light, if necessary.
   *
   * @throws If the {@linkcode CameraDevice} does not support low-light-boost -
   * see {@linkcode CameraDevice.supportsLowLightBoost | supportsLowLightBoost}.
   * @default false
   */
  enableLowLightBoost?: boolean

  // pragma MARK: Focus
  /**
   * If set to `true`, auto-focus will switch between
   * focus states much slower and smoother to appear
   * less intrusive in video recordings.
   *
   * @throws If the {@linkcode CameraDevice} does not support
   * smooth auto focus - see {@linkcode CameraDevice.supportsSmoothAutoFocus | supportsSmoothAutoFocus}.
   * @platform iOS
   * @default false
   */
  enableSmoothAutoFocus?: boolean

  // TODO: Add `enableFaceDrivenAutoFocus`? Disabling that could be less battery heavy.

  // pragma MARK: Distortion Correction
  /**
   * If set to `true`, the camera pipeline may correct
   * areas of the image that may appear distorted - for
   * example the edges of a ultra-wide-angle camera,
   * at the cost of losing a small amount of field of view.
   *
   * When {@linkcode enableDistortionCorrection} is enabled
   * and the camera pipeline applies a crop around the edges,
   * the images will be upscaled to compensate for the artificial
   * zoom - set {@linkcode enableDistortionCorrection} to `false`
   * if you want to avoid this overhead.
   *
   * @throws If the {@linkcode CameraDevice} does not support distortion
   * correction - see {@linkcode CameraDevice.supportsDistortionCorrection | supportsDistortionCorrection}.
   * @platform iOS
   * @default true
   */
  enableDistortionCorrection?: boolean
}

/**
 * A {@linkcode CameraController} allows controlling an opened
 * Camera.
 *
 * You obtain one {@linkcode CameraController} per configured
 * connection via {@linkcode CameraSession.configure | CameraSession.configure(...)},
 * or via the {@linkcode useCamera | useCamera(...)} hook.
 *
 * After a {@linkcode CameraSession} is reconfigured (e.g. when binding
 * new inputs, outputs, or connection settings), you receive a new
 * {@linkcode CameraController}.
 *
 * @example
 * Via the `useCamera(...)` hook:
 * ```ts
 * const device = useCameraDevice('back')
 * const camera = useCamera({
 *   isActive: true,
 *   input: device,
 *   outputs: []
 * })
 * useEffect(() => {
 *   camera?.setZoom(device.maxZoom)
 * }, [camera, device])
 * ```
 * @example
 * Via the imperative `CameraSession` APIs:
 * ```ts
 * const devicesFactory = await VisionCamera.createDeviceFactory()
 * const device = devicesFactory.getDefaultCamera('back')
 * const cameraSession = await VisionCamera.createCameraSession(false)
 * const controller = await cameraSession.configure([
 *   {
 *     input: device,
 *     outputs: [],
 *     constraints: []
 *   }
 * ])
 * await cameraSession.start()
 * controller.setZoom(device.maxZoom)
 * ```
 */
export interface CameraController
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  // pragma MARK: Device
  /**
   * Gets the {@linkcode CameraDevice} this {@linkcode CameraController}
   * is bound to.
   *
   * You can use the {@linkcode device} to query support for
   * available features.
   * @example
   * Querying if the device supports focus metering:
   * ```ts
   * const controller = ...
   * if (controller.supportsFocusMetering) {
   *   const meteringPoint = ...
   *   controller.focusTo(meteringPoint, {
   *     modes: ['AF']
   *   })
   * }
   * ```
   */
  readonly device: CameraDevice

  // pragma MARK: Device State
  /**
   * Gets whether this {@linkcode CameraController} is
   * currently connected to the session.
   */
  readonly isConnected: boolean
  /**
   * Gets whether this {@linkcode CameraController} is
   * currently suspended.
   *
   * A {@linkcode CameraController} may be suspended when
   * the system receives an interruption, such as thermal
   * pressure.
   */
  readonly isSuspended: boolean
  /**
   * Gets whether this {@linkcode CameraController} is
   * currently used by another app with higher priority
   * Camera access, for example when multi-tasking on
   * iPad.
   */
  readonly isUsedByAnotherApp: boolean

  /**
   * Gets whether low light boost is currently enabled.
   *
   * You can enable low light boost via {@linkcode configure | configure(...)}.
   *
   * @example
   * Enabling low light boost:
   * ```ts
   * const controller = ...
   * if (controller.device.supportsLowLightBoost) {
   *   await controller.configure({ enableLowLightBoost: true })
   * }
   * ```
   */
  readonly isLowLightBoostEnabled: boolean
  /**
   * Gets whether smooth auto-focus is currently enabled.
   *
   * You can enable or disable smooth auto-focus via
   * {@linkcode configure | configure(...)} if the {@linkcode CameraDevice}
   * supports smooth auto-focus
   * (see {@linkcode CameraDevice.supportsSmoothAutoFocus}).
   */
  readonly isSmoothAutoFocusEnabled: boolean
  /**
   * Gets whether geometric distortion correction is currently enabled.
   *
   * You can enable or disable distortion correction via
   * {@linkcode configure | configure(...)} if the {@linkcode CameraDevice}
   * supports distortion correction (see
   * {@linkcode CameraDevice.supportsDistortionCorrection}).
   */
  readonly isDistortionCorrectionEnabled: boolean

  // pragma MARK: Configure
  /**
   * Configures this {@linkcode CameraController} with the
   * given {@linkcode CameraControllerConfiguration}.
   *
   * Like a diff-map, setting a value inside the {@linkcode config}
   * object to `undefined`, causes the prop to be left at whatever
   * its current value is.
   */
  configure(config: CameraControllerConfiguration): Promise<void>

  // pragma MARK: Focus
  /**
   * Focuses the Camera pipeline to the specified {@linkcode MeteringPoint},
   * using the specified {@linkcode MeteringMode}s.
   *
   * By default, all metering modes that are supported on this device are enabled -
   * ideally that's {@linkcode MeteringMode | AE}, {@linkcode MeteringMode | AF} and
   * {@linkcode MeteringMode | AWB} - also known as 3A.
   *
   * The returned {@linkcode Promise} resolves once focusing has been fully settled,
   * or rejects if the focusing operation timed out or was canceled.
   * A focus operation can be canceled by calling {@linkcode focusTo | focusTo(...)}
   * again, or by calling {@linkcode resetFocus | resetFocus()}.
   *
   * After the metering operation has settled, the Camera pipeline either keeps
   * the specified {@linkcode MeteringPoint} continuously focused even if
   * the scene at the specific point changes ({@linkcode SceneAdaptiveness | 'continuous'}),
   * or locks the focus/exposure/white-balance values in-place ({@linkcode SceneAdaptiveness | 'locked'}).
   * You can adjust this behaviour via {@linkcode FocusOptions.adaptiveness}.
   *
   * @param point The {@linkcode MeteringPoint} to focus to.
   * @param options Options for this focus operation.
   *
   * @throws If the {@linkcode device} does not support metering (see {@linkcode CameraDevice.supportsFocusMetering})
   * @throws If {@linkcode MeteringMode | 'AE'} is enabled, but the {@linkcode device} does
   * not support metering exposure (see {@linkcode CameraDevice.supportsExposureMetering})
   * @throws If {@linkcode MeteringMode | 'AF'} is enabled, but the {@linkcode device} does
   * not support metering focus (see {@linkcode CameraDevice.supportsFocusMetering})
   * @throws If {@linkcode MeteringMode | 'AWB'} is enabled, but the {@linkcode device} does
   * not support metering white-balance (see {@linkcode CameraDevice.supportsWhiteBalanceMetering})
   * @example
   * Focus center:
   * ```ts
   * const point = VisionCamera.createNormalizedMeteringPoint(0.5, 0.5)
   * await controller.focusTo(point, { responsiveness: 'steady' })
   * ```
   * @example
   * Focus on tap
   * ```ts
   * const onViewTapped = (tapX: number, tapY: number) => {
   *   const point = previewViewRef.createMeteringPoint(tapX, tapY)
   *   await controller.focusTo(point, { responsiveness: 'snappy' })
   * }
   * ```
   * @example
   * Lock focus until `controller.resetFocus()` is called:
   * ```ts
   * const point = previewViewRef.createMeteringPoint(tapX, tapY)
   * await controller.focusTo(point, {
   *   responsiveness: 'snappy',
   *   adaptiveness: 'locked',
   *   autoResetAfter: null
   * })
   * ```
   */
  focusTo(point: MeteringPoint, options: FocusOptions): Promise<void>
  /**
   * Cancels any current focus operations from {@linkcode focusTo | focusTo(...)},
   * resets back all 3A focus modes to continuously auto-focus if they
   * have been previously locked (e.g. via {@linkcode setFocusLocked | setFocusLocked(...)} or
   * {@linkcode lockCurrentFocus | lockCurrentFocus()}, and similar), and
   * resets the focus point of interest to be in the center.
   *
   * @example
   * ```ts
   * await controller.resetFocus()
   * ```
   */
  resetFocus(): Promise<void>
  /**
   * Adds a listener to be fired everytime the subject area
   * substantially changes - e.g. when the user pans away
   * from a scene previously in focus.
   *
   * Returns a {@linkcode ListenerSubscription} - call
   * {@linkcode ListenerSubscription.remove | remove()} on it
   * to stop receiving subject-area-change events. Multiple
   * subscriptions can coexist; the device stops monitoring
   * subject-area changes only once the last subscription is
   * removed.
   *
   * @discussion
   * When manually locking focus (e.g. via
   * {@linkcode focusTo | focusTo(...)} with {@linkcode FocusOptions.adaptiveness adaptiveness} set to {@linkcode SceneAdaptiveness | 'locked'},
   * {@linkcode setFocusLocked | setFocusLocked(...)} (or similar), or
   * {@linkcode lockCurrentFocus | lockCurrentFocus()} (or similar)),
   * it is useful to listen for subject area changes, to reset focus
   * again via {@linkcode resetFocus | resetFocus()}.
   *
   * @platform iOS
   * @example
   * ```ts
   * const controller = ...
   * // Lock AE/AF/AWB
   * await Promise.all([
   *   controller.lockCurrentExposure(),
   *   controller.lockCurrentFocus(),
   *   controller.lockCurrentWhiteBalance(),
   * ])
   * const subscription = controller.addSubjectAreaChangedListener(() => {
   *   // When user moves Camera away, reset AE/AF/AWB again
   *   controller.resetFocus()
   * })
   * // Later, to stop listening:
   * subscription.remove()
   * ```
   */
  addSubjectAreaChangedListener(
    onSubjectAreaChanged: () => void,
  ): ListenerSubscription

  // pragma MARK: Zoom
  /**
   * Represents the current zoom value.
   * Zoom can be set via {@linkcode setZoom | setZoom(...)}.
   */
  readonly zoom: number
  /**
   * Represents the minimum value for the {@linkcode setZoom | zoom}
   * parameter in {@linkcode setZoom | setZoom(...)}.
   */
  readonly minZoom: number
  /**
   * Represents the maximum value for the {@linkcode setZoom | zoom}
   * parameter in {@linkcode setZoom | setZoom(...)}.
   */
  readonly maxZoom: number
  /**
   * A user-displayable zoom factor.
   * @example
   * ```ts
   * const controller = ...           // Triple-Camera
   * controller.zoom                  // 1
   * controller.displayableZoomFactor // 0.5
   * ```
   */
  readonly displayableZoomFactor: number
  /**
   * Sets the Camera's zoom to the
   * specified {@linkcode zoom} value.
   *
   * @throws If the {@linkcode CameraDevice} does not support the given {@linkcode zoom}
   * value. See {@linkcode CameraDevice.minZoom} / {@linkcode CameraDevice.maxZoom}
   * @example
   * Zoom to the maximum:
   * ```ts
   * const controller = ...
   * const maxZoom = controller.device.maxZoom
   * await controller.setZoom(maxZoom)
   * ```
   */
  setZoom(zoom: number): Promise<void>
  /**
   * Starts animating the Camera's zoom
   * to the specified {@linkcode zoom} value,
   * at the specified {@linkcode rate}.
   *
   * @throws If the {@linkcode CameraDevice} does not support the given {@linkcode zoom}
   * value. See {@linkcode CameraDevice.minZoom} / {@linkcode CameraDevice.maxZoom}
   * @example
   * Zoom to the maximum:
   * ```ts
   * const controller = ...
   * const maxZoom = controller.device.maxZoom
   * await controller.startZoomAnimation(maxZoom, 2)
   * ```
   */
  startZoomAnimation(zoom: number, rate: number): Promise<void>
  /**
   * Cancels any zoom animations previously
   * started with {@linkcode startZoomAnimation | startZoomAnimation(...)}.
   */
  cancelZoomAnimation(): Promise<void>

  // pragma MARK: Flash
  /**
   * Get the current Torch's strength, which is a value
   * from `0.0` (weakest) to `1.0` (brightest).
   *
   * The torch's strength can be configured via
   * {@linkcode setTorchMode | setTorchMode('on', ...)}.
   */
  readonly torchStrength: number
  /**
   * Get the current {@linkcode TorchMode}.
   *
   * The torch can be enabled or disabled via
   * {@linkcode setTorchMode | setTorchMode(...)}.
   */
  readonly torchMode: TorchMode
  /**
   * Sets the torch to the specified {@linkcode mode}.
   *
   * - When {@linkcode mode} == {@linkcode TorchMode | 'on'},
   * you can pass {@linkcode strength} to configure the Torch's
   * strength, from `0.0` to `1.0`.
   * - When {@linkcode mode} != {@linkcode TorchMode | 'on'},
   * the {@linkcode strength} parameter is ignored.
   *
   * @throws If the {@linkcode device} does not have a torch (see {@linkcode CameraDevice.hasTorch})
   * @throws If {@linkcode strength} is less than `0` or greater than `1`.
   */
  setTorchMode(mode: TorchMode, strength?: number): Promise<void>

  // pragma MARK: Exposure
  /**
   * Get the current exposure compensation bias, or `0`
   * if the {@linkcode device} does not support exposure
   * bias compensation - see
   * {@linkcode CameraDevice.supportsExposureBias}.
   *
   * A positive value (like `1`) means over-exposed ("brighter"),
   * whereas a negative value (like `-1`) means under-exposed ("darker").
   * The default exposure bias is `0`.
   *
   * You can set exposure bias to a supported value via
   * {@linkcode setExposureBias | setExposureBias(...)}.
   */
  readonly exposureBias: number
  /**
   * Sets the {@linkcode CameraController.exposureBias | exposureBias} to the given
   * {@linkcode exposure} bias value.
   *
   * A positive value (like `1`) means over-exposed ("brighter"),
   * whereas a negative value (like `-1`) means under-exposed ("darker").
   * The default exposure bias is `0`.
   *
   * @throws If the {@linkcode device} does not support setting exposure bias (see {@linkcode CameraDevice.supportsExposureBias})
   * @throws If the {@linkcode device} does not support this {@linkcode exposure} bias value (see {@linkcode CameraDevice.minExposureBias} / {@linkcode CameraDevice.maxExposureBias})
   * @example
   * Set Camera to maximum exposure:
   * ```ts
   * const controller = ...
   * if (controller.device.supportsExposureBias) {
   *   const maxExposure = controller.device.maxExposureBias
   *   await controller.setExposureBias(maxExposure)
   * }
   * ```
   */
  setExposureBias(exposure: number): Promise<void>

  // pragma MARK: Manual Focus
  /**
   * Represents the current {@linkcode FocusMode}.
   * - `'continuous-auto-focus'`: The session is continuously adjusting AF as the scene changes. (the default)
   * - `'auto-focus'`: The session is currently metering to a specific focus length position via {@linkcode focusTo | focusTo(...)}.
   * - `'locked'`: The session is currently locked at a specific {@linkcode lensPosition} via {@linkcode setFocusLocked | setFocusLocked(...)}.
   */
  readonly focusMode: FocusMode
  /**
   * Represents the current focus length, from `0.0` (closest)
   * to `1.0` (furthest), or `0` if the {@linkcode device} does
   * not support manual focus control - see
   * {@linkcode CameraDevice.supportsFocusLocking}.
   *
   * The {@linkcode lensPosition} changes over time (via continuous
   * auto-focus/3A), when focused to a specific point (via
   * {@linkcode focusTo | focusTo(...)}), or when locked to
   * a specific lens-position value (via {@linkcode setFocusLocked | setFocusLocked(...)}).
   */
  readonly lensPosition: number
  /**
   * Locks the focus at the specified {@linkcode lensPosition}.
   *
   * @param lensPosition The position of the Camera lens, from `0.0` (closest) to `1.0` (furthest).
   *
   * @throws If {@linkcode lensPosition} is outside of `0.0` ... `1.0`.
   * @throws If the {@linkcode device} does not support manual focus locking (see {@linkcode CameraDevice.supportsFocusLocking})
   * @platform iOS
   */
  setFocusLocked(lensPosition: number): Promise<void>
  /**
   * Locks the current focus values.
   *
   * You can read the current focus values via
   * {@linkcode lensPosition}.
   * @throws If the {@linkcode CameraDevice} does not support manual focus -
   * see {@linkcode CameraDevice.supportsFocusLocking}
   *
   * To reset focus again to be automatically adjusted by the Camera,
   * use {@linkcode resetFocus | resetFocus()}.
   *
   * @platform iOS
   * @example
   * ```ts
   * const controller = ...
   * if (controller.device.supportsFocusLocking) {
   *   await controller.lockCurrentFocus()
   * }
   * ```
   */
  lockCurrentFocus(): Promise<void>
  // TODO: resetFocus

  // pragma MARK: Manual Exposure
  /**
   * Represents the current {@linkcode ExposureMode}.
   * - `'continuous-auto-exposure'`: The session is continuously adjusting AE as the scene changes. (the default)
   * - `'auto-exposure'`: The session is currently metering to a specific exposure value via {@linkcode focusTo | focusTo(...)}.
   * - `'locked'`: The session is currently locked at a specific {@linkcode exposureDuration}/{@linkcode iso} via {@linkcode setExposureLocked | setExposureLocked(...)}.
   */
  readonly exposureMode: ExposureMode
  /**
   * Represents the minimum value for the {@linkcode setExposureLocked | duration}
   * parameter in {@linkcode setExposureLocked | setExposureLocked(...)}, or `0`
   * if {@linkcode CameraDevice.supportsExposureLocking} is `false`.
   */
  readonly minExposureDuration: number
  /**
   * Represents the maximum value for the {@linkcode setExposureLocked | duration}
   * parameter in {@linkcode setExposureLocked | setExposureLocked(...)}, or `0`
   * if {@linkcode CameraDevice.supportsExposureLocking} is `false`.
   */
  readonly maxExposureDuration: number
  /**
   * Represents the minimum value for the {@linkcode setExposureLocked | iso}
   * parameter in {@linkcode setExposureLocked | setExposureLocked(...)}, or `0`
   * if {@linkcode CameraDevice.supportsExposureLocking} is `false`.
   */
  readonly minISO: number
  /**
   * Represents the maximum value for the {@linkcode setExposureLocked | iso}
   * parameter in {@linkcode setExposureLocked | setExposureLocked(...)}, or `0`
   * if {@linkcode CameraDevice.supportsExposureLocking} is `false`.
   */
  readonly maxISO: number
  /**
   * Represents the current exposure duration, in seconds,
   * or `0` if the {@linkcode device} does not support
   * manual exposure control - see
   * {@linkcode CameraDevice.supportsExposureLocking}..
   *
   * The {@linkcode exposureDuration} value changes over time (via
   * continuous auto-focus/3A), when focused to a specific point (via
   * {@linkcode focusTo | focusTo(...)}), or when locked to
   * a specific duration/ISO value (via {@linkcode setExposureLocked | setExposureLocked(...)}).
   */
  readonly exposureDuration: number
  /**
   * Represents the current ISO value, or `0`
   * if the {@linkcode device} does not support
   * manual exposure control - see
   * {@linkcode CameraDevice.supportsExposureLocking}..
   *
   * The {@linkcode iso} value changes over time (via continuous
   * auto-focus/3A), when focused to a specific point (via
   * {@linkcode focusTo | focusTo(...)}), or when locked to
   * a specific duration/ISO value (via {@linkcode setExposureLocked | setExposureLocked(...)}).
   */
  readonly iso: number
  /**
   * Locks the exposure at the specified {@linkcode duration}
   * and {@linkcode iso} value.
   *
   * @param duration The duration in seconds a single shutter is timed at. It must be a value between {@linkcode minExposureDuration} and {@linkcode maxExposureDuration}.
   * @param iso The ISO value for the Camera. It must be a value between {@linkcode minISO} and {@linkcode maxISO}.
   *
   * @throws If {@linkcode duration} or {@linkcode iso} are not valid values.
   * @throws If the {@linkcode device} does not support manual exposure locking (see {@linkcode CameraDevice.supportsExposureLocking})
   * @platform iOS
   */
  setExposureLocked(duration: number, iso: number): Promise<void>
  /**
   * Locks the current exposure values.
   *
   * You can read the current exposure values via
   * {@linkcode exposureDuration} and {@linkcode iso}.
   * @throws If the {@linkcode CameraDevice} does not support manual exposure -
   * see {@linkcode CameraDevice.supportsExposureLocking}
   *
   * To reset exposure again to be automatically adjusted by the Camera,
   * use {@linkcode resetFocus | resetFocus()}.
   *
   * @platform iOS
   * @example
   * ```ts
   * const controller = ...
   * if (controller.device.supportsExposureLocking) {
   *   await controller.lockCurrentExposure()
   * }
   * ```
   */
  lockCurrentExposure(): Promise<void>
  // TODO: resetExposure

  // pragma MARK: Manual White Balance
  /**
   * Represents the current {@linkcode WhiteBalanceMode}.
   * - `'continuous-auto-white-balance'`: The session is continuously adjusting AWB as the scene changes. (the default)
   * - `'auto-white-balance'`: The session is currently metering to a specific white-balance value via {@linkcode focusTo | focusTo(...)}.
   * - `'locked'`: The session is currently locked at a specific {@linkcode whiteBalanceGains} value via {@linkcode setWhiteBalanceLocked | setWhiteBalanceLocked(...)}.
   */
  readonly whiteBalanceMode: WhiteBalanceMode
  /**
   * Represents the current white balance gains, or
   * `{ 0, 0, 0 }` if the {@linkcode device} does not
   * support manual white-balance control - see
   * {@linkcode CameraDevice.supportsWhiteBalanceLocking}..
   *
   * The {@linkcode whiteBalanceGains} change over time (via continuous
   * auto-focus/3A), when focused to a specific point (via
   * {@linkcode focusTo | focusTo(...)}), or when locked to
   * specific {@linkcode WhiteBalanceGains} (via
   * {@linkcode setWhiteBalanceLocked | setWhiteBalanceLocked(...)}).
   */
  readonly whiteBalanceGains: WhiteBalanceGains
  /**
   * Converts the given {@linkcode whiteBalanceTemperatureAndTint} values
   * to {@linkcode WhiteBalanceGains}.
   * @platform iOS
   */
  convertWhiteBalanceTemperatureAndTintValues(
    whiteBalanceTemperatureAndTint: WhiteBalanceTemperatureAndTint,
  ): WhiteBalanceGains
  /**
   * Locks the white-balance at the specified {@linkcode whiteBalanceGains}
   * value.
   *
   * @param whiteBalanceGains The {@linkcode WhiteBalanceGains} values.
   * Each channel's value must be within `1` and the current {@linkcode device}'s
   * {@linkcode CameraDevice.maxWhiteBalanceGain | maxWhiteBalanceGain} value.
   *
   * @throws If one of the channels in {@linkcode whiteBalanceGains} is out-of-range.
   * @throws If the {@linkcode device} does not support manual white-balance locking (see {@linkcode CameraDevice.supportsWhiteBalanceLocking})
   * @platform iOS
   */
  setWhiteBalanceLocked(whiteBalanceGains: WhiteBalanceGains): Promise<void>
  /**
   * Locks the current white-balance values.
   *
   * You can read the current white-balance values via
   * {@linkcode whiteBalanceGains}.
   * @throws If the {@linkcode CameraDevice} does not support manual white-balance -
   * see {@linkcode CameraDevice.supportsWhiteBalanceLocking}
   *
   * To reset white-balance again to be automatically adjusted by the Camera,
   * use {@linkcode resetFocus | resetFocus()}.
   *
   * @platform iOS
   * @example
   * ```ts
   * const controller = ...
   * if (controller.device.supportsWhiteBalanceLocking) {
   *   await controller.lockCurrentWhiteBalance()
   * }
   * ```
   */
  lockCurrentWhiteBalance(): Promise<void>
  // TODO: resetWhiteBalance
}

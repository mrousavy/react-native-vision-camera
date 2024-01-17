import type { Frame, FrameInternal } from './Frame'
import type { FrameProcessor } from './CameraProps'
import { CameraRuntimeError } from './CameraError'

// only import typescript types
import type TWorklets from 'react-native-worklets-core'
import { CameraModule } from './NativeCameraModule'
import { assertJSIAvailable } from './JSIHelper'

type BasicParameterType = string | number | boolean | undefined
type ParameterType = BasicParameterType | BasicParameterType[] | Record<string, BasicParameterType | undefined>

/**
 * An initialized native instance of a FrameProcessorPlugin.
 * All memory allocated by this plugin will be deleted once this value goes out of scope.
 */
export interface FrameProcessorPlugin {
  /**
   * Call the native Frame Processor Plugin with the given Frame and options.
   * @param frame The Frame from the Frame Processor.
   * @param options (optional) Additional options. Options will be converted to a native dictionary
   * @returns (optional) A value returned from the native Frame Processor Plugin (or undefined)
   */
  call(frame: Frame, options?: Record<string, ParameterType>): ParameterType
}

interface TVisionCameraProxy {
  setFrameProcessor(viewTag: number, frameProcessor: FrameProcessor): void
  removeFrameProcessor(viewTag: number): void
  /**
   * Creates a new instance of a native Frame Processor Plugin.
   * The Plugin has to be registered on the native side, otherwise this returns `undefined`.
   * @param name The name of the Frame Processor Plugin. This has to be the same name as on the native side.
   * @param options (optional) Options, as a native dictionary, passed to the constructor/init-function of the native plugin.
   * @example
   * ```ts
   * const plugin = VisionCameraProxy.initFrameProcessorPlugin('scanFaces', { model: 'fast' })
   * if (plugin == null) throw new Error("Failed to load scanFaces plugin!")
   * ```
   */
  initFrameProcessorPlugin(name: string, options?: Record<string, ParameterType>): FrameProcessorPlugin | undefined
  /**
   * Throws the given error.
   */
  throwJSError(error: unknown): void
}

const errorMessage = 'Frame Processors are not available, react-native-worklets-core is not installed!'

let hasWorklets = false
let isAsyncContextBusy = { value: false }
let runOnAsyncContext = (_frame: Frame, _func: () => void): void => {
  throw new CameraRuntimeError('system/frame-processors-unavailable', errorMessage)
}
let throwJSError = (error: unknown): void => {
  throw error
}

try {
  assertJSIAvailable()

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Worklets } = require('react-native-worklets-core') as typeof TWorklets

  const throwErrorOnJS = Worklets.createRunInJsFn((message: string, stack: string | undefined) => {
    const error = new Error()
    error.message = message
    error.stack = stack
    error.name = 'Frame Processor Error'
    // @ts-expect-error this is react-native specific
    error.jsEngine = 'VisionCamera'
    // From react-native:
    // @ts-ignore the reportFatalError method is an internal method of ErrorUtils not exposed in the type definitions
    global.ErrorUtils.reportFatalError(error)
  })
  throwJSError = (error) => {
    'worklet'
    const safeError = error as Error | undefined
    const message = safeError != null && 'message' in safeError ? safeError.message : 'Frame Processor threw an error.'
    throwErrorOnJS(message, safeError?.stack)
  }

  isAsyncContextBusy = Worklets.createSharedValue(false)
  const asyncContext = Worklets.createContext('VisionCamera.async')
  runOnAsyncContext = Worklets.createRunInContextFn((frame: Frame, func: () => void) => {
    'worklet'
    try {
      // Call long-running function
      func()
    } catch (e) {
      // Re-throw error on JS Thread
      throwJSError(e)
    } finally {
      // Potentially delete Frame if we were the last ref
      const internal = frame as FrameInternal
      internal.decrementRefCount()

      isAsyncContextBusy.value = false
    }
  }, asyncContext)
  hasWorklets = true
} catch (e) {
  // Worklets are not installed, so Frame Processors are disabled.
}

let proxy: TVisionCameraProxy = {
  initFrameProcessorPlugin: () => {
    throw new CameraRuntimeError('system/frame-processors-unavailable', errorMessage)
  },
  removeFrameProcessor: () => {
    throw new CameraRuntimeError('system/frame-processors-unavailable', errorMessage)
  },
  setFrameProcessor: () => {
    throw new CameraRuntimeError('system/frame-processors-unavailable', errorMessage)
  },
  throwJSError: throwJSError,
}
if (hasWorklets) {
  // Install native Frame Processor Runtime Manager
  const result = CameraModule.installFrameProcessorBindings() as unknown
  if (result !== true)
    throw new CameraRuntimeError('system/frame-processors-unavailable', 'Failed to install Frame Processor JSI bindings!')

  // @ts-expect-error global is untyped, it's a C++ host-object
  proxy = global.VisionCameraProxy as TVisionCameraProxy
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (proxy == null) {
    throw new CameraRuntimeError(
      'system/frame-processors-unavailable',
      'Failed to install VisionCameraProxy. Are Frame Processors properly enabled?',
    )
  }
}

export const VisionCameraProxy: TVisionCameraProxy = {
  initFrameProcessorPlugin: proxy.initFrameProcessorPlugin,
  removeFrameProcessor: proxy.removeFrameProcessor,
  setFrameProcessor: proxy.setFrameProcessor,
  throwJSError: throwJSError,
  // TODO: Remove this in the next version
  // @ts-expect-error
  getFrameProcessorPlugin: (name, options) => {
    console.warn(
      '"getFrameProcessorPlugin" has been renamed to "initFrameProcessorPlugin". This function will be removed in the next release.',
    )
    return proxy.initFrameProcessorPlugin(name, options)
  },
}

declare global {
  // eslint-disable-next-line no-var
  var __frameProcessorRunAtTargetFpsMap: Record<string, number | undefined> | undefined
  // eslint-disable-next-line no-var
  var __ErrorUtils:
    | {
        reportFatalError: (error: unknown) => void
      }
    | undefined
}

function getLastFrameProcessorCall(frameProcessorFuncId: string): number {
  'worklet'
  return global.__frameProcessorRunAtTargetFpsMap?.[frameProcessorFuncId] ?? 0
}
function setLastFrameProcessorCall(frameProcessorFuncId: string, value: number): void {
  'worklet'
  if (global.__frameProcessorRunAtTargetFpsMap == null) global.__frameProcessorRunAtTargetFpsMap = {}
  global.__frameProcessorRunAtTargetFpsMap[frameProcessorFuncId] = value
}

/**
 * Runs the given function at the given target FPS rate.
 *
 * For example, if you want to run a heavy face detection algorithm
 * only once per second, you can use `runAtTargetFps(1, ...)` to
 * throttle it to 1 FPS.
 *
 * @param fps The target FPS rate at which the given function should be executed
 * @param func The function to execute.
 * @returns The result of the function if it was executed, or `undefined` otherwise.
 * @example
 *
 * ```ts
 * const frameProcessor = useFrameProcessor((frame) => {
 *   'worklet'
 *   console.log('New Frame')
 *   runAtTargetFps(5, () => {
 *     'worklet'
 *     const faces = detectFaces(frame)
 *     console.log(`Detected a new face: ${faces[0]}`)
 *   })
 * })
 * ```
 */
export function runAtTargetFps<T>(fps: number, func: () => T): T | undefined {
  'worklet'
  // @ts-expect-error
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const funcId = func.__workletHash ?? '1'

  const targetIntervalMs = 1000 / fps // <-- 60 FPS => 16,6667ms interval
  const now = performance.now()
  const diffToLastCall = now - getLastFrameProcessorCall(funcId)
  if (diffToLastCall >= targetIntervalMs) {
    setLastFrameProcessorCall(funcId, now)
    // Last Frame Processor call is already so long ago that we want to make a new call
    return func()
  }
  return undefined
}

/**
 * Runs the given function asynchronously, while keeping a strong reference to the Frame.
 *
 * For example, if you want to run a heavy face detection algorithm
 * while still drawing to the screen at 60 FPS, you can use `runAsync(...)`
 * to offload the face detection algorithm to a separate thread.
 *
 * @param frame The current Frame of the Frame Processor.
 * @param func The function to execute.
 * @example
 *
 * ```ts
 * const frameProcessor = useFrameProcessor((frame) => {
 *   'worklet'
 *   console.log('New Frame')
 *   runAsync(frame, () => {
 *     'worklet'
 *     const faces = detectFaces(frame)
 *     const face = [faces0]
 *     console.log(`Detected a new face: ${face}`)
 *   })
 * })
 * ```
 */
export function runAsync(frame: Frame, func: () => void): void {
  'worklet'

  if (isAsyncContextBusy.value) {
    // async context is currently busy, we cannot schedule new work in time.
    // drop this frame/runAsync call.
    return
  }

  // Increment ref count by one
  const internal = frame as FrameInternal
  internal.incrementRefCount()

  isAsyncContextBusy.value = true

  // Call in separate background context
  runOnAsyncContext(frame, func)
}

import type { Frame, FrameInternal } from './Frame';
import type { FrameProcessor } from './CameraProps';
import { Camera } from './Camera';
import { CameraRuntimeError } from './CameraError';

// only import typescript types
import type TWorklets from 'react-native-worklets-core';

type BasicParameterType = string | number | boolean | undefined;
type ParameterType = BasicParameterType | BasicParameterType[] | Record<string, BasicParameterType | undefined>;

interface FrameProcessorPlugin {
  /**
   * Call the native Frame Processor Plugin with the given Frame and options.
   * @param frame The Frame from the Frame Processor.
   * @param options (optional) Additional options. Options will be converted to a native dictionary
   * @returns (optional) A value returned from the native Frame Processor Plugin (or undefined)
   */
  call: (frame: Frame, options?: Record<string, ParameterType>) => ParameterType;
}

interface TVisionCameraProxy {
  setFrameProcessor: (viewTag: number, frameProcessor: FrameProcessor) => void;
  removeFrameProcessor: (viewTag: number) => void;
  /**
   * Creates a new instance of a Frame Processor Plugin.
   * The Plugin has to be registered on the native side, otherwise this returns `undefined`
   */
  getFrameProcessorPlugin: (name: string) => FrameProcessorPlugin | undefined;
  isSkiaEnabled: boolean;
}

let isAsyncContextBusy = { value: false };
let runOnAsyncContext = (_frame: Frame, _func: () => void): void => {
  throw new CameraRuntimeError(
    'system/frame-processors-unavailable',
    'Frame Processors are not available, react-native-worklets-core is not installed!',
  );
};

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Worklets } = require('react-native-worklets-core') as typeof TWorklets;

  // Install native Frame Processor Runtime Manager
  Camera.installFrameProcessorBindings();
  // @ts-expect-error global is untyped, it's a C++ host-object
  if (global.VisionCameraProxy == null) {
    throw new CameraRuntimeError(
      'system/frame-processors-unavailable',
      'Failed to install VisionCameraProxy. Are Frame Processors properly enabled?',
    );
  }

  isAsyncContextBusy = Worklets.createSharedValue(false);
  const asyncContext = Worklets.createContext('VisionCamera.async');
  runOnAsyncContext = Worklets.createRunInContextFn((frame: Frame, func: () => void) => {
    'worklet';
    try {
      // Call long-running function
      func();
    } finally {
      // Potentially delete Frame if we were the last ref
      (frame as FrameInternal).decrementRefCount();

      isAsyncContextBusy.value = false;
    }
  }, asyncContext);
} catch (e) {
  // Worklets are not installed, so Frame Processors are disabled.
}

// @ts-expect-error global is untyped, it's a C++ host-object
export const VisionCameraProxy = global.VisionCameraProxy as TVisionCameraProxy;

declare global {
  // eslint-disable-next-line no-var
  var __frameProcessorRunAtTargetFpsMap: Record<string, number | undefined> | undefined;
}

function getLastFrameProcessorCall(frameProcessorFuncId: string): number {
  'worklet';
  return global.__frameProcessorRunAtTargetFpsMap?.[frameProcessorFuncId] ?? 0;
}
function setLastFrameProcessorCall(frameProcessorFuncId: string, value: number): void {
  'worklet';
  if (global.__frameProcessorRunAtTargetFpsMap == null) global.__frameProcessorRunAtTargetFpsMap = {};
  global.__frameProcessorRunAtTargetFpsMap[frameProcessorFuncId] = value;
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
  'worklet';
  // @ts-expect-error
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const funcId = func.__workletHash ?? '1';

  const targetIntervalMs = 1000 / fps; // <-- 60 FPS => 16,6667ms interval
  const now = performance.now();
  const diffToLastCall = now - getLastFrameProcessorCall(funcId);
  if (diffToLastCall >= targetIntervalMs) {
    setLastFrameProcessorCall(funcId, now);
    // Last Frame Processor call is already so long ago that we want to make a new call
    return func();
  }
  return undefined;
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
  'worklet';

  if (isAsyncContextBusy.value) {
    // async context is currently busy, we cannot schedule new work in time.
    // drop this frame/runAsync call.
    return;
  }

  // Increment ref count by one
  (frame as FrameInternal).incrementRefCount();

  isAsyncContextBusy.value = true;

  // Call in separate background context
  runOnAsyncContext(frame, func);
}

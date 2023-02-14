import type { Frame } from './Frame';
import { Camera } from './Camera';
import { Worklets } from 'react-native-worklets/src';

// Install VisionCamera Frame Processor JSI Bindings and Plugins
Camera.installFrameProcessorBindings();

type FrameProcessor = (frame: Frame, ...args: unknown[]) => unknown;
type TFrameProcessorPlugins = Record<string, FrameProcessor>;

/**
 * All natively installed Frame Processor Plugins.
 */
export const FrameProcessorPlugins = global.FrameProcessorPlugins as TFrameProcessorPlugins;

const lastFrameProcessorCall = Worklets.createSharedValue(performance.now());

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
 *   const face = runAtTargetFps(5, () => {
 *     'worklet'
 *     const faces = detectFaces(frame)
 *     return faces[0]
 *   })
 *   if (face != null) console.log(`Detected a new face: ${face}`)
 * })
 * ```
 */
export function runAtTargetFps<T>(fps: number, func: () => T): T | undefined {
  'worklet';
  const targetIntervalMs = 1000 / fps; // <-- 60 FPS => 16,6667ms interval
  const now = performance.now();
  const diffToLastCall = now - lastFrameProcessorCall.value;
  if (diffToLastCall >= targetIntervalMs) {
    lastFrameProcessorCall.value = now;
    // Last Frame Processor call is already so long ago that we want to make a new call
    return func();
  }
  return undefined;
}

runAtTargetFps.__initData = {
  code: runAtTargetFps.asString,
  location: runAtTargetFps.__location,
};

const context = Worklets.createContext('VisionCamera.async');

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
  // Increment ref count by one
  frame.refCount++;
  func.__initData = {
    code: func.asString,
    location: func.__location,
  };

  const wrapper = () => {
    'worklet';
    // Call long-running function
    func();

    // Potentially delete Frame if we were the last ref
    frame.refCount--;
    if (frame.refCount <= 0) frame.close();
  };
  wrapper.__initData = {
    code: wrapper.asString,
    location: wrapper.__location,
  };

  const fn = Worklets.createRunInContextFn(wrapper, context);
  fn.__initData = {
    code: fn.asString,
    location: fn.__location,
  };
  fn();
}

runAsync.__initData = {
  code: runAsync.asString,
  location: runAsync.__location,
};

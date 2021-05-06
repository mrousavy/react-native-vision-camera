/* eslint-disable no-var */

/**
 * `true` if currently running in a Frame Processor runtime
 */
declare var _FRAME_PROCESSOR: true | undefined;
/**
 * `true` if currently running in a reanimated UI runtime
 */
declare var _UI: true | undefined;
/**
 * `true` if currently running in a Worklet runtime (frame processor, multithreading, reanimated)
 */
declare var _WORKLET: true | undefined;

/**
 * A native logging function (outputs to Xcode console/Android Logcat)
 */
declare var _log: (message: string) => void | undefined;

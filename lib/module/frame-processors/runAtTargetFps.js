function getLastFrameProcessorCall(frameProcessorFuncId) {
  'worklet';

  return global.__frameProcessorRunAtTargetFpsMap?.[frameProcessorFuncId] ?? 0;
}
function setLastFrameProcessorCall(frameProcessorFuncId, value) {
  'worklet';

  if (global.__frameProcessorRunAtTargetFpsMap == null) global.__frameProcessorRunAtTargetFpsMap = {};
  global.__frameProcessorRunAtTargetFpsMap[frameProcessorFuncId] = value;
}

/**
 * Runs the given {@linkcode func} at the given target {@linkcode fps} rate.
 *
 * {@linkcode runAtTargetFps} still executes the given {@linkcode func} synchronously,
 * so this is only useful for throttling calls to a plugin or logger.
 *
 * For example, if you want to scan faces only once per second to avoid excessive
 * CPU usage, use {@linkcode runAtTargetFps runAtTargetFps(1, ...)}.
 *
 * @param fps The target FPS rate at which the given function should be executed
 * @param func The function to execute.
 * @returns The result of the function if it was executed, or `undefined` otherwise.
 * @worklet
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
export function runAtTargetFps(fps, func) {
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
//# sourceMappingURL=runAtTargetFps.js.map
declare global {
  // eslint-disable-next-line no-var
  var __frameProcessorRunAtTargetFpsMap: Record<string, number | undefined> | undefined
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

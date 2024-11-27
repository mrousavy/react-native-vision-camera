declare global {
    var __frameProcessorRunAtTargetFpsMap: Record<string, number | undefined> | undefined;
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
export declare function runAtTargetFps<T>(fps: number, func: () => T): T | undefined;
//# sourceMappingURL=runAtTargetFps.d.ts.map
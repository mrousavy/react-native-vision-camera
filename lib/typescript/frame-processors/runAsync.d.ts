import type { Frame } from '../types/Frame';
/**
 * Runs the given {@linkcode func} asynchronously on a separate thread,
 * allowing the Frame Processor to continue executing without dropping a Frame.
 *
 * Only one {@linkcode runAsync} call will execute at the same time,
 * so {@linkcode runAsync} is **not parallel**, **but asynchronous**.
 *
 *
 * For example, if your Camera is running at 60 FPS (16ms per frame), and a
 * heavy ML face detection Frame Processor Plugin takes 500ms to execute,
 * you have two options:
 * - Run the plugin normally (synchronously in `useFrameProcessor`)
 * but drop a lot of Frames, as we can only run at 2 FPS (500ms per frame)
 * - Call the plugin inside {@linkcode runAsync} to allow the Camera to still
 * run at 60 FPS, but offload the heavy ML face detection plugin to the
 * asynchronous context, where it will run at 2 FPS.
 *
 * @note {@linkcode runAsync} cannot be used to draw to a Frame in a Skia Frame Processor.
 * @param frame The current Frame of the Frame Processor.
 * @param func The function to execute.
 * @worklet
 * @example
 *
 * ```ts
 * const frameProcessor = useFrameProcessor((frame) => {
 *   'worklet'
 *   console.log('New Frame arrived!')
 *
 *   runAsync(frame, () => {
 *     'worklet'
 *     const faces = detectFaces(frame)
 *     const face = [faces0]
 *     console.log(`Detected a new face: ${face}`)
 *   })
 * })
 * ```
 */
export declare function runAsync(frame: Frame, func: () => void): void;
//# sourceMappingURL=runAsync.d.ts.map
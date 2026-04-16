/**
 * An {@linkcode AsyncRunner} can be used to asynchronously
 * run code in a Frame Processor on a separate, non-blocking
 * Thread.
 */
export interface AsyncRunner {
  /**
   * Get whether the {@linkcode AsyncRunner} is currently
   * busy running a task ({@linkcode runAsync | runAsync(...)}),
   * or not.
   */
  isBusy(): boolean
  /**
   * Run the given {@linkcode task} asynchronously
   * in a Frame Processor.
   *
   * This function returns `true` if the {@linkcode task}
   * was scheduled to run, and `false` if the asynchronous
   * runtime is currently busy - in this case you must
   * drop the Frame.
   * @worklet
   * @param task The worklet to run asynchronously.
   * @returns Whether the task was handled, or not.
   * @example
   * ```ts
   * const frameOutput = useFrameOutput({
   *   onFrame(frame) {
   *     'worklet'
   *     const wasHandled = asyncRunner.runAsync(() => {
   *       'worklet'
   *       doSomeHeavyProcessing(frame)
   *       // Async task finished - dispose the Frame now.
   *       frame.dispose()
   *     })
   *
   *     if (!wasHandled) {
   *       // `AsyncRunner` is busy - drop this Frame!
   *       frame.dispose()
   *     }
   *   }
   * })
   * ```
   */
  runAsync(task: () => void): boolean
}

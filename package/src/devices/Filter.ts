export interface Filter<T> {
  /**
   * The target value for this specific requirement
   */
  target: T;
  /**
   * The priority of this requirement.
   * Filters with higher priority can take precedence over filters with lower priority.
   *
   * For example, if we have two formats:
   * ```json
   * [
   *   videoWidth: 3840,
   *   videoHeight: 2160,
   *   maxFps: 30,
   *   ...
   * ],
   * [
   *   videoWidth: 1920,
   *   videoHeight: 1080,
   *   maxFps: 60,
   *   ...
   * ]
   * ```
   * And your filter looks like this:
   * ```json
   * {
   *   fps: { target: 60, priority: 1 }
   *   videoSize: { target: { width: 4000, height: 2000 }, priority: 3 }
   * }
   * ```
   * The 4k format will be chosen since the `videoSize` filter has a higher priority (2) than the `fps` filter (1).
   *
   * To choose the 60 FPS format instead, use a higher priority for the `fps` filter:
   * ```json
   * {
   *   fps: { target: 60, priority: 2 }
   *   videoSize: { target: { width: 4000, height: 2000 }, priority: 1 }
   * }
   * ```
   */
  priority: number;
}

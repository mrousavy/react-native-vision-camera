import type { UInt64 } from 'react-native-nitro-modules'

/**
 * An unmanaged memory pointer to a native platform buffer.
 *
 * This is a shared contract between libraries to interact
 * with native buffers without natively typed bindings.
 *
 * Consumers, like react-native-skia or react-native-wgpu
 * can accept a `NativeBuffer`-shaped object that has a
 * {@linkcode pointer} and a {@linkcode release} function
 * to unwrap the native buffer from it, load it as a GPU
 * Texture, and release it once it has been rendered.
 *
 * @example
 * ```ts
 * const frame = ...
 * const nativeBuffer = frame.getNativeBuffer()
 * // your processing...
 * nativeBuffer.release()
 * frame.dispose()
 * ```
 */
export interface NativeBuffer {
  /**
   * A uint64_t/uintptr_t to the native platform buffer, with a retain count of +1.
   * - On iOS; this points to a `CVPixelBufferRef`
   * - On Android; this points to a `AHardwareBuffer*`
   */
  readonly pointer: UInt64
  /**
   * Release this reference to the platform buffer again, effectively decrementing the retain count by -1.
   *
   * @note This must always be called as soon as possible, otherwise the pipeline will stall.
   * @note There might still be other references, so it does not guarantee buffer deletion.
   */
  release(): void
}

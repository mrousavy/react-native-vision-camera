package com.margelo.nitro.camera.utils

class NativeBufferHelper {
  @Suppress("KotlinJniMissingFunction")
  companion object {
    /**
     * Converts the given HardwareBuffer (boxed as [Any])
     * to a pointer address ([Long]).
     *
     * This acquires a reference count of +1, which must be released
     * later again via [releaseHardwareBufferPointer].
     */
    @JvmStatic
    external fun getHardwareBufferPointer(hardwareBuffer: Any): Long

    /**
     * Releases a HardwareBuffer which is passed here as
     * a pointer address ([Long]), which was previously boxed
     * via [getHardwareBufferPointer].
     *
     * This must be called exactly once.
     * Never call it and you have a leak, call it twice
     * and you have a double free. Good luck.
     */
    @JvmStatic
    external fun releaseHardwareBufferPointer(hardwareBufferPointer: Long)
  }
}

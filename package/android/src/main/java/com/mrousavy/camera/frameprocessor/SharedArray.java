package com.mrousavy.camera.frameprocessor;

import androidx.annotation.Keep;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

import java.nio.ByteBuffer;

/**
 * A JSI TypedArray/ArrayBuffer implementation used for passing buffers between JS and Native without copying data.
 * ByteBuffers are used for efficient data transfer.
 *
 * @noinspection JavaJniMissingFunction
 */
public final class SharedArray {
    @DoNotStrip
    @Keep
    private final HybridData mHybridData;

    @DoNotStrip
    @Keep
    private SharedArray(HybridData hybridData) {
        mHybridData = hybridData;
    }

    /**
     * Allocate a new SharedArray with the given size. Use `getByteBuffer` to obtain a reference to the direct ByteBuffer for writing.
     * @param proxy The VisionCamera Proxy from the Frame Processor Plugin's initializer.
     * @param size The size of the ArrayBuffer.
     */
    public SharedArray(VisionCameraProxy proxy, int size) {
        mHybridData = initHybrid(proxy, size);
    }

    /**
     * Wraps the given ByteBuffer in a SharedArray without copying. Using `getByteBuffer` will return the same instance which can be used for writing.
     * @param proxy The VisionCamera Proxy from the Frame Processor Plugin's initializer.
     * @param byteBuffer The ByteBuffer to wrap.
     */
    public SharedArray(VisionCameraProxy proxy, ByteBuffer byteBuffer) {
        mHybridData = initHybrid(proxy, byteBuffer);
    }

    /**
     * Gets the direct ByteBuffer that can be used to directly update the JSI ArrayBuffer.
     */
    public native ByteBuffer getByteBuffer();

    /**
     * Gets the size of the ByteBuffer.
     */
    public native int getSize();

    private native HybridData initHybrid(VisionCameraProxy proxy, int size);
    private native HybridData initHybrid(VisionCameraProxy proxy, ByteBuffer byteBuffer);
}

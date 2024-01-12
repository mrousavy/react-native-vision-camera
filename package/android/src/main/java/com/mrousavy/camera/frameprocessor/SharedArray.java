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
    public SharedArray(HybridData hybridData) {
        mHybridData = hybridData;
    }

    /**
     * Allocate a new SharedArray. Use `getByteBuffer` to obtain a reference to the direct ByteBuffer for writing.
     * @param proxy The VisionCamera Proxy from the Frame Processor Plugin's initializer.
     * @param dataType The ArrayBuffer's data type. `Type.Int8Array` = `Int8Array` in JS
     * @param size The size of the ArrayBuffer.
     */
    public SharedArray(VisionCameraProxy proxy, Type dataType, int size) {
        mHybridData = initHybrid(proxy, dataType.ordinal(), size);
    }

    /**
     * Gets the direct ByteBuffer that can be used to directly update the JSI ArrayBuffer.
     */
    public native ByteBuffer getByteBuffer();

    private native HybridData initHybrid(VisionCameraProxy proxy, int dataType, int size);

    /**
     * The Type of the SharedArray.
     */
    public enum Type {
        // Values start at 0 and need to match with JSITypedArray.h::TypedArrayKind
        Int8Array,
        Int16Array,
        Int32Array,
        Uint8Array,
        Uint8ClampedArray,
        Uint16Array,
        Uint32Array,
        Float32Array,
        Float64Array,
    }
}

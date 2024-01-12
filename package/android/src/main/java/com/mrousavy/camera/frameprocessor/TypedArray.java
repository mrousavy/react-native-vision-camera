package com.mrousavy.camera.frameprocessor;

import androidx.annotation.Keep;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

/** @noinspection JavaJniMissingFunction*/
public final class TypedArray {
    @DoNotStrip
    @Keep
    private final HybridData mHybridData;

    public TypedArray(VisionCameraProxy proxy, int dataType, int size) {
        mHybridData = initHybrid(proxy, dataType, size);
    }

    private native HybridData initHybrid(VisionCameraProxy proxy, int dataType, int size);

    /**
     * The Type of the TypedArray.
     */
    enum Type {
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

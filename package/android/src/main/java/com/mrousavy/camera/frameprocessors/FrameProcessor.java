package com.mrousavy.camera.frameprocessors;

import androidx.annotation.Keep;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

import dalvik.annotation.optimization.FastNative;

/**
 * Represents a JS Frame Processor
 * @noinspection JavaJniMissingFunction
 */
public final class FrameProcessor {
    /**
     * Call the JS Frame Processor function with the given Frame
     */
    @FastNative
    public native void call(Frame frame);

    /** @noinspection FieldCanBeLocal, unused */
    @DoNotStrip
    @Keep
    private final HybridData mHybridData;

    @DoNotStrip
    @Keep
    public FrameProcessor(HybridData hybridData) {
        mHybridData = hybridData;
    }
}

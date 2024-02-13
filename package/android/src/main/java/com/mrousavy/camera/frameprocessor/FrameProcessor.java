package com.mrousavy.camera.frameprocessor;

import androidx.annotation.Keep;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

/**
 * Represents a JS Frame Processor
 * @noinspection JavaJniMissingFunction
 */
public final class FrameProcessor {
    /**
     * Call the JS Frame Processor function with the given Frame
     */
    public native void call(Frame frame);

    @DoNotStrip
    @Keep
    private final HybridData mHybridData;

    @DoNotStrip
    @Keep
    public FrameProcessor(HybridData hybridData) {
        mHybridData = hybridData;
    }
}

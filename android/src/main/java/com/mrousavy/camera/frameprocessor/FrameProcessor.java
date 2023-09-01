package com.mrousavy.camera.frameprocessor;

import androidx.annotation.Keep;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

/**
 * Represents a JS Frame Processor. It's actual implementation is in NDK/C++.
 */
public class FrameProcessor {
    @DoNotStrip
    @Keep
    private final HybridData mHybridData;

    public FrameProcessor(HybridData hybridData) {
        mHybridData = hybridData;
    }
}

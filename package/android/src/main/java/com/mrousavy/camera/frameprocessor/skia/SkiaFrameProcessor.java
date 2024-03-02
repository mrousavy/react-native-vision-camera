package com.mrousavy.camera.frameprocessor.skia;

import androidx.annotation.Keep;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.mrousavy.camera.frameprocessor.Frame;
import com.mrousavy.camera.frameprocessor.FrameProcessor;

/**
 * Represents a JS Skia Frame Processor
 * @noinspection JavaJniMissingFunction
 */
public class SkiaFrameProcessor extends FrameProcessor {
    /** @noinspection FieldCanBeLocal, unused */
    @DoNotStrip
    @Keep
    private final HybridData mHybridData;

    /** @noinspection unused */
    @DoNotStrip
    @Keep
    public SkiaFrameProcessor(HybridData hybridData) {
        super(hybridData);
        mHybridData = hybridData;
    }

    public native void call(Frame frame, Object boxedSurface);
}

package com.mrousavy.camera.skia;

import com.facebook.jni.HybridData;
import com.mrousavy.camera.frameprocessor.FrameProcessor;

public class SkiaFrameProcessor extends FrameProcessor {
    // Implementation is in JSkiaFrameProcessor.cpp
    public SkiaFrameProcessor(HybridData hybridData) {
        super(hybridData);
    }
}

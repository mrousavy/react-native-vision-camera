package com.mrousavy.camera.frameprocessor;

import androidx.annotation.Keep;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.proguard.annotations.DoNotStrip;

/**
 * Represents a JS Frame Processor
 */
public abstract class FrameProcessor {
    /**
     * Call the JS Frame Processor function with the given Frame
     */
    public native void call(Frame frame);
}

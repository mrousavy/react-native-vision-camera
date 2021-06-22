package com.mrousavy.camera.frameprocessor;

import androidx.camera.core.ImageProxy;

import com.facebook.jni.HybridData;

/**
 * Declares a Frame Processor Plugin.
 */
public abstract class FrameProcessorPlugin {
    static {
        System.loadLibrary("VisionCamera");
    }

    private final String name;

    /**
     * Gets the Frame Processor Plugin's name without the two prefixed underscores (`__`).
     */
    public String getName() {
        return name;
    }

    /**
     * The actual Frame Processor plugin callback. Called for every frame the ImageAnalyzer receives.
     * @param image The CameraX ImageProxy. Don't call .close() on this, as VisionCamera handles that.
     */
    public abstract void callback(ImageProxy image);

    /**
     * Registers this plugin to the Frame Processor Runtime Manager.
     * @param name Specifies the Frame Processor Plugin's name in the Runtime.
     *             The actual name in the JS Runtime will be prefixed with two underscores (`__`)
     */
    private FrameProcessorPlugin(String name) {
        this.name = name;
        initHybrid(name);
        FrameProcessorRuntimeManager.Companion.getPlugins().add(this);
    }

    private native HybridData initHybrid(String name);
}

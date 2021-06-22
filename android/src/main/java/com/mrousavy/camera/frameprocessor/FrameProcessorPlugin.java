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

    @SuppressWarnings({"FieldCanBeLocal", "unused"})
    private final HybridData mHybridData;

    /**
     * The actual Frame Processor plugin callback. Called for every frame the ImageAnalyzer receives.
     * @param image The CameraX ImageProxy. Don't call .close() on this, as VisionCamera handles that.
     */
    public abstract void callback(ImageProxy image);

    /**
     * Initializes the native plugin part.
     * @param name Specifies the Frame Processor Plugin's name in the Runtime.
     *             The actual name in the JS Runtime will be prefixed with two underscores (`__`)
     */
    protected FrameProcessorPlugin(String name) {
        mHybridData = initHybrid(name);
    }

    private native HybridData initHybrid(String name);

    /**
     * Registers the given plugin in the Frame Processor Runtime.
     * @param plugin An instance of a plugin.
     */
    public static void register(FrameProcessorPlugin plugin) {
        FrameProcessorRuntimeManager.Companion.getPlugins().add(plugin);
    }
}

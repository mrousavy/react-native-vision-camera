package com.mrousavy.camera.frameprocessor;

import androidx.camera.core.ImageProxy;

/**
 * Declares a Frame Processor Plugin.
 */
public abstract class FrameProcessorPlugin {
    /**
     * The actual Frame Processor plugin callback. Called for every frame the ImageAnalyzer receives.
     * @param image The CameraX ImageProxy. Don't call .close() on this, as VisionCamera handles that.
     */
    public abstract void callback(ImageProxy image);

    /**
     * Registers this plugin to the Frame Processor Runtime Manager.
     */
    private FrameProcessorPlugin() {
        FrameProcessorRuntimeManager.Companion.getPlugins().add(this);
    }
}

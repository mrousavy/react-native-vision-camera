package com.mrousavy.camera.frameprocessor;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import java.util.concurrent.ExecutorService;

@SuppressWarnings("JavaJniMissingFunction") // using fbjni here
public class VisionCameraScheduler {
    @SuppressWarnings({"unused", "FieldCanBeLocal"})
    @DoNotStrip
    private final HybridData mHybridData;
    private final ExecutorService frameProcessorThread;

    public VisionCameraScheduler(ExecutorService frameProcessorThread) {
        this.frameProcessorThread = frameProcessorThread;
        mHybridData = initHybrid();
    }

    private native HybridData initHybrid();
    private native void triggerUI();

    @SuppressWarnings("unused")
    @DoNotStrip
    private void scheduleTrigger() {
        frameProcessorThread.submit(this::triggerUI);
    }
}

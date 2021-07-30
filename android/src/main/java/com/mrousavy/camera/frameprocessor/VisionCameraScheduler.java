package com.mrousavy.camera.frameprocessor;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.mrousavy.camera.CameraViewModule;

@SuppressWarnings("JavaJniMissingFunction") // using fbjni here
public class VisionCameraScheduler {
    @DoNotStrip
    private final HybridData mHybridData;

    public VisionCameraScheduler() {
        mHybridData = initHybrid();
    }

    @Override
    protected void finalize() throws Throwable {
        mHybridData.resetNative();
        super.finalize();
    }

    private native HybridData initHybrid();
    private native void triggerUI();

    @DoNotStrip
    private void scheduleTrigger() {
        CameraViewModule.Companion.getFrameProcessorThread().submit(this::triggerUI);
    }
}

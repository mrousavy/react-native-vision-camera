package com.mrousavy.camera.frameprocessors;

import androidx.annotation.Keep;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.mrousavy.camera.core.CameraQueues;

@SuppressWarnings("JavaJniMissingFunction") // using fbjni here
public class VisionCameraScheduler {
    @SuppressWarnings({"unused", "FieldCanBeLocal"})
    @DoNotStrip
    @Keep
    private final HybridData mHybridData;

    public VisionCameraScheduler() {
        mHybridData = initHybrid();
    }

    private native HybridData initHybrid();
    private native void trigger();

    @SuppressWarnings("unused")
    @DoNotStrip
    private void scheduleTrigger() {
        CameraQueues.CameraQueue videoQueue = CameraQueues.Companion.getVideoQueue();
        videoQueue.getHandler().post(this::trigger);
    }
}

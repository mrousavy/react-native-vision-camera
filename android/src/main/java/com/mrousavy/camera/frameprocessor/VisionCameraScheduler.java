package com.mrousavy.camera.frameprocessor;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.mrousavy.camera.CameraQueues;

import java.util.concurrent.ExecutorService;

@SuppressWarnings("JavaJniMissingFunction") // using fbjni here
public class VisionCameraScheduler {
    @SuppressWarnings({"unused", "FieldCanBeLocal"})
    @DoNotStrip
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
        // TODO: Make sure post(this::trigger) works.
        videoQueue.getHandler().post(this::trigger);
    }
}

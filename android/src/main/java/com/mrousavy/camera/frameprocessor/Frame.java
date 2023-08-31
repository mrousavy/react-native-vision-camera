package com.mrousavy.camera.frameprocessor;

import com.facebook.jni.HybridData;

import java.nio.ByteBuffer;

/** @noinspection JavaJniMissingFunction*/
public class Frame {
    private final HybridData mHybridData;

    public Frame(HybridData hybridData) {
        mHybridData = hybridData;
    }

    @Override
    protected void finalize() throws Throwable {
        super.finalize();
        mHybridData.resetNative();
    }

    public native int getWidth();
    public native int getHeight();
    public native int getBytesPerRow();
    public native long getTimestamp();
    public native String getOrientation();
    public native boolean getIsMirrored();
    public native String getPixelFormat();
    public native ByteBuffer getByteBuffer();
    public native boolean getIsValid();

    private native void incrementRefCount();
    private native void decrementRefCount();
    private native void close();
}

package com.mrousavy.camera.frameprocessor;

import com.facebook.jni.HybridData;

import java.nio.ByteBuffer;

/** @noinspection JavaJniMissingFunction*/
public class Frame {
    private final HybridData mHybridData;

    private Frame(HybridData hybridData) {
        mHybridData = hybridData;
    }

    @Override
    protected void finalize() throws Throwable {
        super.finalize();
        mHybridData.resetNative();
    }

    /**
     * Get the width of the Frame, in it's sensor orientation. (in pixels)
     */
    public native int getWidth();
    /**
     * Get the height of the Frame, in it's sensor orientation. (in pixels)
     */
    public native int getHeight();
    /**
     * Get the number of bytes per row.
     * * To get the number of components per pixel you can divide this with the Frame's width.
     * * To get the total size of the byte buffer you can multiply this with the Frame's height.
     */
    public native int getBytesPerRow();
    /**
     * Get the local timestamp of this Frame. This is always monotonically increasing for each Frame.
     */
    public native long getTimestamp();
    /**
     * Get the Orientation of this Frame. The return value is the result of `Orientation.toUnionValue()`.
     */
    public native String getOrientation();
    /**
     * Return whether this Frame is mirrored or not. Frames from the front-facing Camera are often mirrored.
     */
    public native boolean getIsMirrored();
    /**
     * Get the pixel-format of this Frame. The return value is the result of `PixelFormat.toUnionValue()`.
     */
    public native String getPixelFormat();
    /**
     * Get the actual backing pixel data of this Frame using a zero-copy C++ ByteBuffer.
     */
    public native ByteBuffer getByteBuffer();
    /**
     * Get whether this Frame is still valid.
     * A Frame is valid as long as it hasn't been closed by the Frame Processor Runtime Manager
     * (either because it ran out of Frames in it's queue and needs to close old ones, or because
     * a Frame Processor finished executing and you're still trying to hold onto this Frame in native)
     */
    public native boolean getIsValid();

    private native void incrementRefCount();
    private native void decrementRefCount();
    private native void close();
}

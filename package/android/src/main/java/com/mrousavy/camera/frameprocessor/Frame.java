package com.mrousavy.camera.frameprocessor;

import android.hardware.HardwareBuffer;
import android.media.Image;
import android.os.Build;
import com.facebook.proguard.annotations.DoNotStrip;
import com.mrousavy.camera.core.FrameInvalidError;
import com.mrousavy.camera.core.HardwareBuffersNotAvailableError;
import com.mrousavy.camera.types.PixelFormat;
import com.mrousavy.camera.types.Orientation;
import java.lang.IllegalStateException;

public class Frame {
    private final Image image;
    private final boolean isMirrored;
    private final long timestamp;
    private final Orientation orientation;
    private int refCount = 0;

    public Frame(Image image, long timestamp, Orientation orientation, boolean isMirrored) {
        this.image = image;
        this.timestamp = timestamp;
        this.orientation = orientation;
        this.isMirrored = isMirrored;
    }

    private void assertIsValid() throws FrameInvalidError {
        if (!getIsImageValid(image)) {
            throw new FrameInvalidError();
        }
    }

    private synchronized boolean getIsImageValid(Image image) {
        if (refCount <= 0) return false;
        try {
            // will throw an exception if the image is already closed
            image.getFormat();
            // no exception thrown, image must still be valid.
            return true;
        } catch (IllegalStateException e) {
            // exception thrown, image has already been closed.
            return false;
        }
    }

    public synchronized Image getImage() {
        return image;
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public synchronized int getWidth() throws FrameInvalidError {
        assertIsValid();
        return image.getWidth();
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public synchronized int getHeight() throws FrameInvalidError {
        assertIsValid();
        return image.getHeight();
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public synchronized boolean getIsValid() throws FrameInvalidError {
        assertIsValid();
        return getIsImageValid(image);
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public synchronized boolean getIsMirrored() throws FrameInvalidError {
        assertIsValid();
        return isMirrored;
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public synchronized long getTimestamp() throws FrameInvalidError {
        assertIsValid();
        return timestamp;
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public synchronized Orientation getOrientation() throws FrameInvalidError {
        assertIsValid();
        return orientation;
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public synchronized PixelFormat getPixelFormat() throws FrameInvalidError {
        assertIsValid();
        return PixelFormat.Companion.fromImageFormat(image.getFormat());
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public synchronized int getPlanesCount() throws FrameInvalidError {
        assertIsValid();
        return image.getPlanes().length;
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public synchronized int getBytesPerRow() throws FrameInvalidError {
        assertIsValid();
        return image.getPlanes()[0].getRowStride();
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    private Object getHardwareBufferBoxed() throws HardwareBuffersNotAvailableError, FrameInvalidError {
        return getHardwareBuffer();
    }

    public synchronized HardwareBuffer getHardwareBuffer() throws HardwareBuffersNotAvailableError, FrameInvalidError {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
            throw new HardwareBuffersNotAvailableError();
        }
        assertIsValid();
        return image.getHardwareBuffer();
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public synchronized void incrementRefCount() {
        refCount++;
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public synchronized void decrementRefCount() {
        refCount--;
        if (refCount <= 0) {
            // If no reference is held on this Image, close it.
            close();
        }
    }

    private synchronized void close() {
        image.close();
    }
}

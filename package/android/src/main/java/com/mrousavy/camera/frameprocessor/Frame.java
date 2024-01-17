package com.mrousavy.camera.frameprocessor;

import android.hardware.HardwareBuffer;
import android.media.Image;
import android.os.Build;
import com.facebook.proguard.annotations.DoNotStrip;
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

    public Image getImage() {
        synchronized (this) {
            Image img = image;
            if (!getIsImageValid(img)) {
                throw new RuntimeException("Frame is already closed! " +
                    "Are you trying to access the Image data outside of a Frame Processor's lifetime?\n" +
                    "- If you want to use `console.log(frame)`, use `console.log(frame.toString())` instead.\n" +
                    "- If you want to do async processing, use `runAsync(...)` instead.\n" +
                    "- If you want to use runOnJS, increment it's ref-count: `frame.incrementRefCount()`");
            }
            return img;
        }
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public int getWidth() {
        return getImage().getWidth();
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public int getHeight() {
        return getImage().getHeight();
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public boolean getIsValid() {
        return getIsImageValid(getImage());
    }

    private boolean getIsImageValid(Image image) {
        try {
            // will throw an exception if the image is already closed
            synchronized (this) { image.getFormat(); }
            // no exception thrown, image must still be valid.
            return true;
        } catch (IllegalStateException e) {
            // exception thrown, image has already been closed.
            return false;
        }
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public boolean getIsMirrored() {
        return isMirrored;
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public long getTimestamp() {
        return timestamp;
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public Orientation getOrientation() {
        return orientation;
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public PixelFormat getPixelFormat() {
        return PixelFormat.Companion.fromImageFormat(getImage().getFormat());
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public int getPlanesCount() {
        return getImage().getPlanes().length;
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public int getBytesPerRow() {
        return getImage().getPlanes()[0].getRowStride();
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public Object getHardwareBufferBoxed() throws HardwareBuffersNotAvailableError {
        return getHardwareBuffer();
    }

    public HardwareBuffer getHardwareBuffer() throws HardwareBuffersNotAvailableError {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
            throw new HardwareBuffersNotAvailableError();
        }
        return getImage().getHardwareBuffer();
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public void incrementRefCount() {
        synchronized (this) {
            refCount++;
        }
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public void decrementRefCount() {
        synchronized (this) {
            refCount--;
            if (refCount <= 0) {
                // If no reference is held on this Image, close it.
                close();
            }
        }
    }

    private synchronized void close() {
        synchronized (this) {
            image.close();
        }
    }
}

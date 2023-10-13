package com.mrousavy.camera.frameprocessor;

import android.hardware.HardwareBuffer;
import android.media.Image;
import android.os.Build;
import com.facebook.proguard.annotations.DoNotStrip;
import com.mrousavy.camera.core.HardwareBuffersNotAvailableError;
import com.mrousavy.camera.parsers.PixelFormat;
import com.mrousavy.camera.parsers.Orientation;

public class Frame {
    private final Image image;
    private final boolean isMirrored;
    private final long timestamp;
    private final Orientation orientation;
    private int refCount = 0;
    private HardwareBuffer hardwareBuffer = null;

    public Frame(Image image, long timestamp, Orientation orientation, boolean isMirrored) {
        this.image = image;
        this.timestamp = timestamp;
        this.orientation = orientation;
        this.isMirrored = isMirrored;
    }

    public Image getImage() {
        return image;
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public int getWidth() {
        return image.getWidth();
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public int getHeight() {
        return image.getHeight();
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public boolean getIsValid() {
        try {
            // will throw an exception if the image is already closed
            image.getCropRect();
            // no exception thrown, image must still be valid.
            return true;
        } catch (Exception e) {
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
    public String getOrientation() {
        return orientation.getUnionValue();
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public String getPixelFormat() {
        PixelFormat format = PixelFormat.Companion.fromImageFormat(image.getFormat());
        return format.getUnionValue();
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public int getPlanesCount() {
        return image.getPlanes().length;
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public int getBytesPerRow() {
        return image.getPlanes()[0].getRowStride();
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
        if (hardwareBuffer == null) {
            hardwareBuffer = image.getHardwareBuffer();
        }
        return hardwareBuffer;
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
                image.close();
            }
        }
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    private void close() {
        if (hardwareBuffer != null) {
            hardwareBuffer.close();
        }
        image.close();
    }
}

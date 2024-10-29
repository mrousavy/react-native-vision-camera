package com.mrousavy.camera.frameprocessors;

import android.graphics.Matrix;
import android.hardware.HardwareBuffer;
import android.media.Image;
import android.os.Build;

import androidx.annotation.OptIn;
import androidx.camera.core.ExperimentalGetImage;
import androidx.camera.core.ImageProxy;

import com.facebook.proguard.annotations.DoNotStrip;
import com.mrousavy.camera.core.FrameInvalidError;
import com.mrousavy.camera.core.HardwareBuffersNotAvailableError;
import com.mrousavy.camera.core.types.PixelFormat;
import com.mrousavy.camera.core.types.Orientation;
import java.lang.IllegalStateException;

public class Frame {
    private final ImageProxy imageProxy;
    private int refCount = 0;

    public Frame(ImageProxy image) {
        this.imageProxy = image;
    }

    private void assertIsValid() throws FrameInvalidError {
        if (!getIsImageValid(imageProxy)) {
            throw new FrameInvalidError();
        }
    }

    public ImageProxy getImageProxy() throws FrameInvalidError {
        assertIsValid();
        return imageProxy;
    }

    @OptIn(markerClass = ExperimentalGetImage.class)
    public Image getImage() throws FrameInvalidError {
        assertIsValid();
        Image image = imageProxy.getImage();
        if (image == null) {
            throw new FrameInvalidError();
        }
        return image;
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public int getWidth() throws FrameInvalidError {
        assertIsValid();
        return imageProxy.getWidth();
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public int getHeight() throws FrameInvalidError {
        assertIsValid();
        return imageProxy.getHeight();
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public boolean getIsValid() {
        return getIsImageValid(imageProxy);
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public boolean getIsMirrored() throws FrameInvalidError {
        assertIsValid();
        Matrix matrix = imageProxy.getImageInfo().getSensorToBufferTransformMatrix();
        float[] values = new float[9];
        matrix.getValues(values);
        // Check if the X scale factor is negative, indicating a horizontal flip.
        return values[0] < 0;
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public long getTimestamp() throws FrameInvalidError {
        assertIsValid();
        return imageProxy.getImageInfo().getTimestamp();
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public Orientation getOrientation() throws FrameInvalidError {
        assertIsValid();
        int degrees = imageProxy.getImageInfo().getRotationDegrees();
        Orientation orientation = Orientation.Companion.fromRotationDegrees(degrees);
        // .rotationDegrees is the rotation that needs to be applied to make the image appear
        // upright. Our orientation is the actual orientation of the Frame, so the opposite. Reverse it.
        return orientation.reversed();
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public PixelFormat getPixelFormat() throws FrameInvalidError {
        assertIsValid();
        return PixelFormat.Companion.fromImageFormat(imageProxy.getFormat());
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public int getPlanesCount() throws FrameInvalidError {
        assertIsValid();
        return imageProxy.getPlanes().length;
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public int getBytesPerRow() throws FrameInvalidError {
        assertIsValid();
        return imageProxy.getPlanes()[0].getRowStride();
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    private Object getHardwareBufferBoxed() throws HardwareBuffersNotAvailableError, FrameInvalidError {
        return getHardwareBuffer();
    }

    public HardwareBuffer getHardwareBuffer() throws HardwareBuffersNotAvailableError, FrameInvalidError {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
            throw new HardwareBuffersNotAvailableError();
        }
        assertIsValid();
        return getImage().getHardwareBuffer();
    }

    private synchronized boolean getIsImageValid(ImageProxy image) {
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

    private void close() {
        imageProxy.close();
    }
}

package com.mrousavy.camera.frameprocessor;

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
import com.mrousavy.camera.types.PixelFormat;
import com.mrousavy.camera.types.Orientation;
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

    public synchronized ImageProxy getImageProxy() {
        return imageProxy;
    }

    @OptIn(markerClass = ExperimentalGetImage.class)
    public synchronized Image getImage() throws FrameInvalidError {
        Image image = imageProxy.getImage();
        if (image == null) {
            throw new FrameInvalidError();
        }
        return image;
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public synchronized int getWidth() throws FrameInvalidError {
        assertIsValid();
        return imageProxy.getWidth();
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public synchronized int getHeight() throws FrameInvalidError {
        assertIsValid();
        return imageProxy.getHeight();
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public synchronized boolean getIsValid() throws FrameInvalidError {
        assertIsValid();
        return getIsImageValid(imageProxy);
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public synchronized boolean getIsMirrored() throws FrameInvalidError {
        assertIsValid();
        Matrix matrix = imageProxy.getImageInfo().getSensorToBufferTransformMatrix();
        float[] values = new float[9];
        matrix.getValues(values);
        // Check if the X scale factor is negative, indicating a horizontal flip.
        return values[0] < 0;
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public synchronized long getTimestamp() throws FrameInvalidError {
        assertIsValid();
        return imageProxy.getImageInfo().getTimestamp();
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public synchronized Orientation getOrientation() throws FrameInvalidError {
        assertIsValid();
        int degrees = imageProxy.getImageInfo().getRotationDegrees();
        return Orientation.Companion.fromRotationDegrees(degrees);
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public synchronized PixelFormat getPixelFormat() throws FrameInvalidError {
        assertIsValid();
        return PixelFormat.Companion.fromImageFormat(imageProxy.getFormat());
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public synchronized int getPlanesCount() throws FrameInvalidError {
        assertIsValid();
        return imageProxy.getPlanes().length;
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public synchronized int getBytesPerRow() throws FrameInvalidError {
        assertIsValid();
        return imageProxy.getPlanes()[0].getRowStride();
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
        return getImage().getHardwareBuffer();
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
        imageProxy.close();
    }
}

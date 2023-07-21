package com.mrousavy.camera.frameprocessor;

import android.annotation.SuppressLint;
import android.graphics.ImageFormat;
import android.graphics.Matrix;
import android.media.Image;
import androidx.camera.core.ImageProxy;
import com.facebook.proguard.annotations.DoNotStrip;
import java.nio.ByteBuffer;

public class Frame {
    private final ImageProxy imageProxy;

    public Frame(ImageProxy imageProxy) {
        this.imageProxy = imageProxy;
    }

    public ImageProxy getImageProxy() {
        return imageProxy;
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public int getWidth() {
        return imageProxy.getWidth();
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public int getHeight() {
        return imageProxy.getHeight();
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public boolean getIsValid() {
        try {
            @SuppressLint("UnsafeOptInUsageError")
            Image image = imageProxy.getImage();
            if (image == null) return false;
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
        Matrix matrix = imageProxy.getImageInfo().getSensorToBufferTransformMatrix();
        // TODO: Figure out how to get isMirrored from ImageProxy
        return false;
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public long getTimestamp() {
        return imageProxy.getImageInfo().getTimestamp();
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public String getOrientation() {
        int rotation = imageProxy.getImageInfo().getRotationDegrees();
        if (rotation >= 45 && rotation < 135)
            return "landscapeRight";
        if (rotation >= 135 && rotation < 225)
            return "portraitUpsideDown";
        if (rotation >= 225 && rotation < 315)
            return "landscapeLeft";
        return "portrait";
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public int getPlanesCount() {
        return imageProxy.getPlanes().length;
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    public int getBytesPerRow() {
        return imageProxy.getPlanes()[0].getRowStride();
    }

    private static byte[] byteArrayCache;

    @SuppressWarnings("unused")
    @DoNotStrip
    public byte[] toByteArray() {
        switch (imageProxy.getFormat()) {
            case ImageFormat.YUV_420_888:
                ByteBuffer yBuffer = imageProxy.getPlanes()[0].getBuffer();
                ByteBuffer vuBuffer = imageProxy.getPlanes()[2].getBuffer();
                int ySize = yBuffer.remaining();
                int vuSize = vuBuffer.remaining();

                if (byteArrayCache == null || byteArrayCache.length != ySize + vuSize) {
                    byteArrayCache = new byte[ySize + vuSize];
                }

                yBuffer.get(byteArrayCache, 0, ySize);
                vuBuffer.get(byteArrayCache, ySize, vuSize);

                return byteArrayCache;
            default:
                throw new RuntimeException("Cannot convert Frame with Format " + imageProxy.getFormat() + " to byte array!");
        }
    }

    @SuppressWarnings("unused")
    @DoNotStrip
    private void close() {
        imageProxy.close();
    }
}

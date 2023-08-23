package com.mrousavy.camera.frameprocessor;

import android.graphics.ImageFormat;
import android.media.Image;
import com.facebook.proguard.annotations.DoNotStrip;
import com.mrousavy.camera.parsers.PixelFormat;
import com.mrousavy.camera.parsers.Orientation;

import java.nio.ByteBuffer;

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

    private static ByteBuffer byteArrayCache;

    @SuppressWarnings("unused")
    @DoNotStrip
    public ByteBuffer toByteBuffer() {
        switch (image.getFormat()) {
            case ImageFormat.YUV_420_888:
                ByteBuffer yBuffer = image.getPlanes()[0].getBuffer();
                ByteBuffer uBuffer = image.getPlanes()[1].getBuffer();
                ByteBuffer vBuffer = image.getPlanes()[2].getBuffer();
                int ySize = yBuffer.remaining();
                int uSize = uBuffer.remaining();
                int vSize = vBuffer.remaining();
                int totalSize = ySize + uSize + vSize;

                if (byteArrayCache == null) {
                    byteArrayCache = ByteBuffer.allocateDirect(totalSize);
                }

                byteArrayCache.rewind();
                byteArrayCache.put(yBuffer).put(uBuffer).put(vBuffer);

                return byteArrayCache;
            case ImageFormat.JPEG:
                return image.getPlanes()[0].getBuffer();
            default:
                throw new RuntimeException("Cannot convert Frame with Format " + image.getFormat() + " to byte array!");
        }
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
        image.close();
    }
}

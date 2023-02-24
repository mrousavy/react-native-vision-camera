package com.mrousavy.camera.frameprocessor;

import android.annotation.SuppressLint;
import android.graphics.ImageFormat;
import android.media.Image;

import androidx.annotation.Keep;
import com.facebook.proguard.annotations.DoNotStrip;

import java.nio.ByteBuffer;

@SuppressWarnings("unused") // used through JNI
@DoNotStrip
@Keep
public class ImageUtils {
    @SuppressLint("UnsafeOptInUsageError")
    @DoNotStrip
    @Keep
    public static boolean isImageValid(Image image) {
        try {
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

    @DoNotStrip
    @Keep
    public static boolean isImageMirrored(Image image) {
        // TODO: Figure out how to get isMirrored from Image
        return false;
    }

    @DoNotStrip
    @Keep
    public static String getOrientation(Image image) {
        int rotation = 45; // TODO: Figure out Rotation image.getImageInfo().getRotationDegrees();
        if (rotation >= 45 && rotation < 135)
            return "landscapeRight";
        if (rotation >= 135 && rotation < 225)
            return "portraitUpsideDown";
        if (rotation >= 225 && rotation < 315)
            return "landscapeLeft";
        return "portrait";
    }

    @DoNotStrip
    @Keep
    public static long getTimestamp(Image image) {
        return image.getTimestamp();
    }

    @DoNotStrip
    @Keep
    public static int getPlanesCount(Image image) {
        return image.getPlanes().length;
    }

    @DoNotStrip
    @Keep
    public static int getBytesPerRow(Image image) {
        return image.getPlanes()[0].getRowStride();
    }

    private static byte[] byteArrayCache;

    @DoNotStrip
    @Keep
    public static byte[] toByteArray(Image image) {
        switch (image.getFormat()) {
        case ImageFormat.YUV_420_888:
            ByteBuffer yBuffer = image.getPlanes()[0].getBuffer();
            ByteBuffer vuBuffer = image.getPlanes()[2].getBuffer();
            int ySize = yBuffer.remaining();
            int vuSize = vuBuffer.remaining();

            if (byteArrayCache == null || byteArrayCache.length != ySize + vuSize) {
                byteArrayCache = new byte[ySize + vuSize];
            }

            yBuffer.get(byteArrayCache, 0, ySize);
            vuBuffer.get(byteArrayCache, ySize, vuSize);

            return byteArrayCache;
        default:
            throw new RuntimeException("Cannot convert Frame with Format " + image.getFormat() + " to byte array!");
        }
    }
}

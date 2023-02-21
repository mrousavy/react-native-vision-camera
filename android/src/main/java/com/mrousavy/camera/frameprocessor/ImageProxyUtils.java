package com.mrousavy.camera.frameprocessor;

import android.annotation.SuppressLint;
import android.graphics.ImageFormat;
import android.graphics.Matrix;
import android.media.Image;

import androidx.annotation.Keep;
import androidx.camera.core.ImageProxy;
import com.facebook.proguard.annotations.DoNotStrip;

import java.nio.ByteBuffer;

@SuppressWarnings("unused") // used through JNI
@DoNotStrip
@Keep
public class ImageProxyUtils {
    @SuppressLint("UnsafeOptInUsageError")
    @DoNotStrip
    @Keep
    public static boolean isImageProxyValid(ImageProxy imageProxy) {
        try {
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

    @DoNotStrip
    @Keep
    public static boolean isImageProxyMirrored(ImageProxy imageProxy) {
        Matrix matrix = imageProxy.getImageInfo().getSensorToBufferTransformMatrix();
        // TODO: Figure out how to get isMirrored from ImageProxy
        return false;
    }

    @DoNotStrip
    @Keep
    public static String getOrientation(ImageProxy imageProxy) {
        int rotation = imageProxy.getImageInfo().getRotationDegrees();
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
    public static long getTimestamp(ImageProxy imageProxy) {
        return imageProxy.getImageInfo().getTimestamp();
    }

    @DoNotStrip
    @Keep
    public static int getPlanesCount(ImageProxy imageProxy) {
        return imageProxy.getPlanes().length;
    }

    @DoNotStrip
    @Keep
    public static int getBytesPerRow(ImageProxy imageProxy) {
        return imageProxy.getPlanes()[0].getRowStride();
    }

    private static byte[] byteArrayCache;

    @DoNotStrip
    @Keep
    public static byte[] toByteArray(ImageProxy imageProxy) {
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
}

package com.mrousavy.camera.frameprocessor;

import android.annotation.SuppressLint;
import android.media.Image;

import androidx.annotation.Keep;
import androidx.camera.core.ImageProxy;
import com.facebook.proguard.annotations.DoNotStrip;

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
            imageProxy.getImage().getCropRect();
            // no exception thrown, image must still be valid.
            return true;
        } catch (Exception e) {
            // exception thrown, image has already been closed.
            return false;
        }
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
}

package com.mrousavy.camera.frameprocessor;

import android.annotation.SuppressLint;
import android.media.Image;
import androidx.camera.core.ImageProxy;
import com.facebook.proguard.annotations.DoNotStrip;

public class ImageProxyUtils {
    @SuppressLint("UnsafeOptInUsageError")
    @DoNotStrip
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
}

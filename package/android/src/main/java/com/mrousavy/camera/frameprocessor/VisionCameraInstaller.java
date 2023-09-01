package com.mrousavy.camera.frameprocessor;

@SuppressWarnings("JavaJniMissingFunction") // we use fbjni
public class VisionCameraInstaller {
    public static native void install(VisionCameraProxy proxy);
}

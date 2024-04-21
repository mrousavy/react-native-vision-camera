package com.mrousavy.camera.frameprocessors;

@SuppressWarnings("JavaJniMissingFunction") // we use fbjni
public class VisionCameraInstaller {
    public static native void install(VisionCameraProxy proxy);
}

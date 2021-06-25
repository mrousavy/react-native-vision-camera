package com.mrousavy.camera.frameprocessor;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.camera.core.ImageProxy;
import com.facebook.jni.HybridData;

/**
 * Declares a Frame Processor Plugin.
 */
public abstract class FrameProcessorPlugin {
    static {
        System.loadLibrary("VisionCamera");
    }

    @SuppressWarnings({"FieldCanBeLocal", "unused"})
    private final HybridData mHybridData;

    /**
     * The actual Frame Processor plugin callback. Called for every frame the ImageAnalyzer receives.
     * @param image The CameraX ImageProxy. Don't call .close() on this, as VisionCamera handles that.
     * @return You can return any primitive, map or array you want. See the
     * <a href="https://mrousavy.github.io/react-native-vision-camera/docs/guides/frame-processors-plugins-overview#types">Types</a>
     * table for a list of supported types.
     */
    public abstract @Nullable Object callback(@NonNull ImageProxy image, @NonNull Object[] params);

    /**
     * Initializes the native plugin part.
     * @param name Specifies the Frame Processor Plugin's name in the Runtime.
     *             The actual name in the JS Runtime will be prefixed with two underscores (`__`)
     */
    protected FrameProcessorPlugin(@NonNull String name) {
        mHybridData = initHybrid(name);
    }

    @Override
    protected void finalize() throws Throwable {
        super.finalize();
        if (mHybridData != null) {
            mHybridData.resetNative();
        }
    }

    private native @NonNull HybridData initHybrid(@NonNull String name);

    /**
     * Registers the given plugin in the Frame Processor Runtime.
     * @param plugin An instance of a plugin.
     */
    public static void register(@NonNull FrameProcessorPlugin plugin) {
        FrameProcessorRuntimeManager.Companion.getPlugins().add(plugin);
    }
}

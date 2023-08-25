package com.mrousavy.camera.frameprocessor;

import androidx.annotation.Keep;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.proguard.annotations.DoNotStrip;
import java.util.Map;

/**
 * Declares a Frame Processor Plugin.
 */
@DoNotStrip
@Keep
public abstract class FrameProcessorPlugin {
    /**
     * The actual Frame Processor plugin callback. Called for every frame the ImageAnalyzer receives.
     * @param frame The Frame from the Camera. Don't call .close() on this, as VisionCamera handles that.
     * @return You can return any primitive, map or array you want. See the
     * <a href="https://react-native-vision-camera.com/docs/guides/frame-processors-plugins-overview#types">Types</a>
     * table for a list of supported types.
     */
    @DoNotStrip
    @Keep
    public abstract @Nullable Object callback(@NonNull Frame frame, @Nullable Map<String, Object> params);
}

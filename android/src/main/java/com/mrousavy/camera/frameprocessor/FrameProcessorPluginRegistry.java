package com.mrousavy.camera.frameprocessor;

import androidx.annotation.Keep;
import androidx.annotation.Nullable;

import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.ReadableNativeMap;

import java.util.HashMap;
import java.util.Map;

@DoNotStrip
@Keep
public class FrameProcessorPluginRegistry {
    private static final Map<String, PluginInitializer> Plugins = new HashMap<>();

    @DoNotStrip
    @Keep
    public static void addFrameProcessorPlugin(String name, PluginInitializer pluginInitializer) {
        assert !Plugins.containsKey(name) : "Tried to add a Frame Processor Plugin with a name that already exists! " +
                "Either choose unique names, or remove the unused plugin. Name: ";
        Plugins.put(name, pluginInitializer);
    }

    @DoNotStrip
    @Keep
    public static FrameProcessorPlugin getPlugin(String name, ReadableNativeMap options) {
        PluginInitializer initializer = Plugins.get(name);
        if (initializer == null) {
            return null;
        }
        return initializer.initializePlugin(options);
    }

    public interface PluginInitializer {
        FrameProcessorPlugin initializePlugin(@Nullable ReadableNativeMap options);
    }
}

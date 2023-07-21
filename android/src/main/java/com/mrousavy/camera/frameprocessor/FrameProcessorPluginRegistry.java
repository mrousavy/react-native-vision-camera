package com.mrousavy.camera.frameprocessor;

import androidx.annotation.Keep;

import com.facebook.proguard.annotations.DoNotStrip;

import java.util.HashMap;
import java.util.Map;

@DoNotStrip
@Keep
public class FrameProcessorPluginRegistry {
    private static final Map<String, PluginInitializer> _plugins = new HashMap<>();

    @DoNotStrip
    @Keep
    public static void addFrameProcessorPlugin(String name, PluginInitializer pluginInitializer) throws Exception {
        if (_plugins.containsKey(name)) {
            throw new Exception("Tried to add a Frame Processor Plugin with a name that already exists! " +
                    "Either choose unique names, or remove the unused plugin. Name: " + name);
        }
        _plugins.put(name, pluginInitializer);
    }

    @DoNotStrip
    @Keep
    public static FrameProcessorPlugin getPlugin(String name, Object options) {
        PluginInitializer initializer = _plugins.get(name);
        if (initializer == null) {
            return null;
        }
        return initializer.initializePlugin(options);
    }

    public interface PluginInitializer {
        FrameProcessorPlugin initializePlugin(Object options);
    }
}

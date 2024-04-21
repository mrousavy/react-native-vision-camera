package com.mrousavy.camera.frameprocessors;

import android.util.Log;
import androidx.annotation.Keep;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.proguard.annotations.DoNotStrip;
import java.util.Map;
import java.util.HashMap;

@DoNotStrip
@Keep
public class FrameProcessorPluginRegistry {
    private static final Map<String, PluginInitializer> Plugins = new HashMap<>();
    private static final String TAG = "FrameProcessorPluginRegistry";

    /**
     * Adds the given Plugin to the Frame Processor Plugin Registry.
     * The given Plugin might then be initialized later from JavaScript, through the <code>VisionCameraProxy</code>.
     * The returned Plugin will be deallocated once the value is no longer used in JavaScript.
     * <p></p>
     * This function can be called from any Thread, and should be called as soon as possible - ideally on app start
     * or in a static initializer.
     *
     * @param name The name of the plugin which will be used to find the plugin from the JS side.
     * @param pluginInitializer An initializer function to create instances of this Plugin.
     */
    @DoNotStrip
    @Keep
    public static void addFrameProcessorPlugin(String name, PluginInitializer pluginInitializer) {
        assert !Plugins.containsKey(name) : "Tried to add a Frame Processor Plugin with a name that already exists! " +
                "Either choose unique names, or remove the unused plugin. Name: " + name;
        Plugins.put(name, pluginInitializer);
        Log.i(TAG, "Successfully registered Frame Processor Plugin \"" + name + "\"!");
    }

    @DoNotStrip
    @Keep
    public static @Nullable FrameProcessorPlugin getPlugin(String name, VisionCameraProxy proxy, Map<String, Object> options) {
        Log.i(TAG, "Looking up Frame Processor Plugin \"" + name + "\"...");
        PluginInitializer initializer = Plugins.get(name);
        if (initializer == null) {
            Log.i(TAG, "Frame Processor Plugin \"" + name + "\" does not exist!");
            return null;
        }
        Log.i(TAG, "Frame Processor Plugin \"" + name + "\" found! Initializing...");
        return initializer.initializePlugin(proxy, options);
    }

    public interface PluginInitializer {
        @NonNull FrameProcessorPlugin initializePlugin(@NonNull VisionCameraProxy proxy, @Nullable Map<String, Object> options);
    }
}

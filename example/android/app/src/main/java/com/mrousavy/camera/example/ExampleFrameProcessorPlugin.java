package com.mrousavy.camera.example;

import android.util.Log;

import androidx.camera.core.ImageProxy;

import com.facebook.react.bridge.ReadableNativeMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.mrousavy.camera.frameprocessor.Frame;
import com.mrousavy.camera.frameprocessor.FrameProcessorPlugin;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

import java.util.HashMap;

public class ExampleFrameProcessorPlugin extends FrameProcessorPlugin {
    @Override
    public Object callback(@NotNull Frame frame, @Nullable ReadableNativeMap params) {
        HashMap<String, Object> hashMap = params != null ? params.toHashMap() : new HashMap<>();
        ImageProxy image = frame.getImageProxy();

        Log.d("ExamplePlugin", image.getWidth() + " x " + image.getHeight() + " Image with format #" + image.getFormat() + ". Logging " + hashMap.size() + " parameters:");

        for (String key : hashMap.keySet()) {
            Object value = hashMap.get(key);
            Log.d("ExamplePlugin", "  -> " + (value == null ? "(null)" : value.toString() + " (" + value.getClass().getName() + ")"));
        }

        WritableNativeMap map = new WritableNativeMap();
        map.putString("example_str", "Test");
        map.putBoolean("example_bool", true);
        map.putDouble("example_double", 5.3);

        WritableNativeArray array = new WritableNativeArray();
        array.pushString("Hello!");
        array.pushBoolean(true);
        array.pushDouble(17.38);

        map.putArray("example_array", array);
        return map;
    }

    ExampleFrameProcessorPlugin() {

    }
}

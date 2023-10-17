package com.mrousavy.camera.example;

import android.media.Image;
import android.util.Log;

import com.mrousavy.camera.frameprocessor.Frame;
import com.mrousavy.camera.frameprocessor.FrameProcessorPlugin;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ExampleFrameProcessorPlugin extends FrameProcessorPlugin {
    @Override
    public Object callback(@NotNull Frame frame, @Nullable Map<String, Object> params) {
        if (params == null) return null;
        Image image = frame.getImage();

        Log.d("ExamplePlugin", image.getWidth() + " x " + image.getHeight() + " Image with format #" + image.getFormat() + ". Logging " + params.size() + " parameters:");

        for (String key : params.keySet()) {
            Object value = params.get(key);
            Log.d("ExamplePlugin", "  -> " + (value == null ? "(null)" : value + " (" + value.getClass().getName() + ")"));
        }

        Map<String, Object> map = new HashMap<>();
        map.put("example_str", "Test");
        map.put("example_bool", true);
        map.put("example_double", 5.3);

        List<Object> array = new ArrayList<>();
        array.add("Hello!");
        array.add(true);
        array.add(17.38);

        map.put("example_array", array);
        return map;
    }

    ExampleFrameProcessorPlugin(@Nullable Map<String, Object> options) {
        Log.d("ExamplePlugin", " - options: " + options.toString());
    }
}

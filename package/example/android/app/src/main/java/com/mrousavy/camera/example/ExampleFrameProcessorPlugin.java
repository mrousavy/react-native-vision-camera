package com.mrousavy.camera.example;

import android.media.Image;
import android.util.Log;

import com.mrousavy.camera.frameprocessor.Frame;
import com.mrousavy.camera.frameprocessor.FrameProcessorPlugin;
import com.mrousavy.camera.frameprocessor.SharedArray;
import com.mrousavy.camera.frameprocessor.VisionCameraProxy;

import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ExampleFrameProcessorPlugin extends FrameProcessorPlugin {
    SharedArray _sharedArray;

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

        ByteBuffer byteBuffer = _sharedArray.getByteBuffer();
        byteBuffer.put(0, (byte)(Math.random() * 100));
        map.put("example_array_buffer", _sharedArray);

        return map;
    }

    ExampleFrameProcessorPlugin(VisionCameraProxy proxy, @Nullable Map<String, Object> options) {
        super();
        _sharedArray = new SharedArray(proxy, SharedArray.Type.Uint8Array, 5);
        Log.d("ExamplePlugin", "ExampleFrameProcessorPlugin initialized with options: " + options);
    }
}

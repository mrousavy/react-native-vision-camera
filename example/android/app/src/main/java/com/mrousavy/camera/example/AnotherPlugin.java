package com.mrousavy.camera.example;

import android.util.Log;
import androidx.camera.core.ImageProxy;
import com.mrousavy.camera.frameprocessor.FrameProcessorPlugin;
import org.jetbrains.annotations.NotNull;

public class AnotherPlugin extends FrameProcessorPlugin {
    @Override
    public Object callback(@NotNull ImageProxy image, @NotNull Object[] params) {
        Log.d("AnotherPlugin", "AnotherPlugin called with " + params.length + " parameters.");

        return 5;
    }

    AnotherPlugin() {
        super("another_plugin");
    }
}

package com.mrousavy.camera.example;

import android.util.Log;

import com.mrousavy.camera.frameprocessor.FrameProcessorPlugin;

public class ScanQRCodePlugin extends FrameProcessorPlugin {
    @Override
    public void callback(androidx.camera.core.ImageProxy image) {
        Log.d("FPPPPPPP", "YEEEEEEEEEET - Format: " + image.getFormat());
    }

    ScanQRCodePlugin() {
        super("exampleObjC___scanQRCodes");
    }
}

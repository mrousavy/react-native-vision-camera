package com.mrousavy.camera.example;

import android.util.Log;
import androidx.camera.core.ImageProxy;
import com.mrousavy.camera.frameprocessor.FrameProcessorPlugin;

public class ScanQRCodePlugin extends FrameProcessorPlugin {
    @Override
    public Object callback(ImageProxy image) {
        Log.d("FPPPPPPP", "YEEEEEEEEEET - Format: " + image.getFormat());
        return null;
    }

    ScanQRCodePlugin() {
        super("exampleObjC___scanQRCodes");
    }
}

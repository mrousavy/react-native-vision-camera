package com.mrousavy.camera.example;

import android.util.Log;
import androidx.camera.core.ImageProxy;
import com.mrousavy.camera.frameprocessor.FrameProcessorPlugin;

import java.util.ArrayList;

public class ScanQRCodePlugin extends FrameProcessorPlugin {
    @Override
    public Object callback(ImageProxy image, Object[] params) {
        Log.d("FPPPPPPP", "YEEEEEEEEEET - Format: " + image.getFormat() + " - params size: " + params.length);

        for (Object param : params) {
            Log.d("FPPPPPPP", "YEEEEEEEEEET - Param: " + (param == null ? "(null)" : param.toString()));
        }

        return true;
    }

    ScanQRCodePlugin() {
        super("exampleObjC___scanQRCodes");
    }
}

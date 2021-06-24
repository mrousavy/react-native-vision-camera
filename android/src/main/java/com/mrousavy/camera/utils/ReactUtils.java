package com.mrousavy.camera.utils;

import androidx.annotation.Keep;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.ReadableNativeMap;
import java.util.Map;

public class ReactUtils {
    @Keep
    @DoNotStrip
    public static Map<String, Object> readableMapToMap(Object map) {
        if (map instanceof ReadableNativeMap) {
            return ((ReadableNativeMap) map).toHashMap();
        } else {
            return null;
        }
    }
}

package com.mrousavy.camera.example

import android.util.Log
import com.mrousavy.camera.frameprocessor.Frame
import com.mrousavy.camera.frameprocessor.FrameProcessorPlugin

class ExampleKotlinFrameProcessorPlugin(options: Map<String, Any>?): FrameProcessorPlugin(options) {
    init {
        Log.d("ExampleKotlinPlugin", " - options" + options?.toString())
    }

    override fun callback(frame: Frame, params: Map<String, Any>?): Any? {
        if (params == null) {
            return null
        }

        val image = frame.image
        Log.d(
            "ExampleKotlinPlugin",
            image.width.toString() + " x " + image.height + " Image with format #" + image.format + ". Logging " + params.size + " parameters:"
        )

        for (key in params.keys) {
            val value = params[key]
            Log.d("ExampleKotlinPlugin", "  -> " + if (value == null) "(null)" else value.toString() + " (" + value.javaClass.name + ")")
        }

        return hashMapOf<String, Any>(
            "example_str" to "KotlinTest",
            "example_bool" to false,
            "example_double" to 6.7,
            "example_array" to arrayListOf<Any>(
                "Good bye",
                false,
                21.37
            )
        )
    }
}

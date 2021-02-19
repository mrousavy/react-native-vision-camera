package com.mrousavy.camera.utils

import android.annotation.SuppressLint
import android.graphics.BitmapFactory
import android.graphics.ImageFormat
import androidx.camera.core.ImageProxy
import com.mrousavy.camera.InvalidFormatError
import java.io.File
import java.io.FileOutputStream
import java.nio.ByteBuffer
import java.util.stream.Stream.concat

// TODO: Fix this flip() function (this outputs a black image)
fun flip(imageBytes: ByteArray, imageWidth: Int): ByteArray {
    //separate out the sub arrays
    var holder = ByteArray(imageBytes.size)
    var subArray = ByteArray(imageWidth)
    var subCount = 0
    for (i in imageBytes.indices) {
        subArray[subCount] = imageBytes[i]
        subCount++
        if (i % imageWidth == 0) {
            subArray.reverse()
            if (i == imageWidth) {
                holder = subArray
            } else {
                holder += subArray
            }
            subCount = 0
            subArray = ByteArray(imageWidth)
        }
    }
    subArray = ByteArray(imageWidth)
    System.arraycopy(imageBytes, imageBytes.size - imageWidth, subArray, 0, subArray.size)
    return holder + subArray
}


@SuppressLint("UnsafeExperimentalUsageError")
fun ImageProxy.save(file: File, flipHorizontally: Boolean) {
    when (format) {
        // TODO: ImageFormat.RAW_SENSOR
        // TODO: ImageFormat.DEPTH_JPEG
        ImageFormat.JPEG -> {
            val buffer = planes[0].buffer
            val bytes = ByteArray(buffer.remaining())

            // copy image from buffer to byte array
            buffer.get(bytes)

            val output = FileOutputStream(file)
            output.write(bytes)
            output.close()
        }
        ImageFormat.YUV_420_888 -> {
            // "prebuffer" simply contains the meta information about the following planes.
            val prebuffer = ByteBuffer.allocate(16)
            prebuffer.putInt(width)
                    .putInt(height)
                    .putInt(planes[1].pixelStride)
                    .putInt(planes[1].rowStride)

            val output = FileOutputStream(file)
            output.write(prebuffer.array()) // write meta information to file
            // Now write the actual planes.
            var buffer: ByteBuffer
            var bytes: ByteArray

            for (i in 0..2) {
                buffer = planes[i].buffer
                bytes = ByteArray(buffer.remaining()) // makes byte array large enough to hold image
                buffer.get(bytes) // copies image from buffer to byte array
                output.write(bytes) // write the byte array to file
            }
            output.close()
        }
        else -> throw InvalidFormatError(format)
    }
}

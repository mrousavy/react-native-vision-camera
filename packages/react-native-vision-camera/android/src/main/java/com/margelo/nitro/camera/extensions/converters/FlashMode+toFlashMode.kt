package com.margelo.nitro.camera.extensions.converters

import androidx.camera.core.ImageCapture
import com.margelo.nitro.camera.FlashMode

@ImageCapture.FlashMode
fun FlashMode.toFlashMode(): Int {
  return when (this) {
    FlashMode.ON -> ImageCapture.FLASH_MODE_ON
    FlashMode.OFF -> ImageCapture.FLASH_MODE_OFF
    FlashMode.AUTO -> ImageCapture.FLASH_MODE_AUTO
  }
}

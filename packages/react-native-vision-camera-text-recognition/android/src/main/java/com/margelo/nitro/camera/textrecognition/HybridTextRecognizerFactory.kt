package com.margelo.nitro.camera.textrecognition

import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.camera.HybridCameraOutputSpec

@DoNotStrip
@Keep
class HybridTextRecognizerFactory : HybridTextRecognizerFactorySpec() {
  @DoNotStrip
  @Keep
  override fun createTextRecognizer(): HybridTextRecognizerSpec {
    return HybridTextRecognizer()
  }

  @DoNotStrip
  @Keep
  override fun createTextRecognitionOutput(options: TextRecognitionOutputOptions): HybridCameraOutputSpec {
    return HybridTextRecognitionOutput(options)
  }
}

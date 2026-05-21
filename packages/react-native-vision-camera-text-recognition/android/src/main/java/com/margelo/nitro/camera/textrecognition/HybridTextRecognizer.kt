package com.margelo.nitro.camera.textrecognition

import androidx.annotation.OptIn
import androidx.camera.core.ExperimentalGetImage
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import com.margelo.nitro.camera.HybridFrameSpec
import com.margelo.nitro.camera.textrecognition.extensions.toInputImage
import com.margelo.nitro.core.Promise

class HybridTextRecognizer : HybridTextRecognizerSpec() {
  private val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

  @OptIn(ExperimentalGetImage::class)
  override fun recognizeText(frame: HybridFrameSpec): RecognizedText {
    val image = frame.toInputImage()
    val task = recognizer.process(image)
    val text = Tasks.await(task)
    return text.toRecognizedText()
  }

  override fun recognizeTextAsync(frame: HybridFrameSpec): Promise<RecognizedText> {
    val promise = Promise<RecognizedText>()

    val image = frame.toInputImage()
    recognizer
      .process(image)
      .addOnSuccessListener { text ->
        promise.resolve(text.toRecognizedText())
      }.addOnFailureListener { error ->
        promise.reject(error)
      }

    return promise
  }
}

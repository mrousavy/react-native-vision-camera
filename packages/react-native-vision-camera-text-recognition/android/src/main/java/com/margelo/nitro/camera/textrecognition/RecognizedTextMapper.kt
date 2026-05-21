package com.margelo.nitro.camera.textrecognition

import android.graphics.Point as AndroidPoint
import android.graphics.Rect as AndroidRect
import com.google.mlkit.vision.text.Text
import com.google.mlkit.vision.text.Text.Element as MLTextElement
import com.google.mlkit.vision.text.Text.Line as MLTextLine
import com.google.mlkit.vision.text.Text.TextBlock as MLTextBlock

private fun AndroidRect?.toRect(): Rect {
  val box = this ?: return Rect(0.0, 0.0, 0.0, 0.0)
  return Rect(box.left.toDouble(), box.right.toDouble(), box.top.toDouble(), box.bottom.toDouble())
}

private fun Array<AndroidPoint>?.toPoints(): Array<Point> {
  val points = this ?: return emptyArray()
  return points
    .map { point -> Point(point.x.toDouble(), point.y.toDouble()) }
    .toTypedArray()
}

private fun String?.toLanguageCodes(): Array<String> {
  return if (isNullOrBlank()) emptyArray() else arrayOf(this)
}

private fun MLTextElement.toTextElement(): TextElement {
  return TextElement(
    text,
    boundingBox.toRect(),
    cornerPoints.toPoints(),
    recognizedLanguage.toLanguageCodes(),
  )
}

private fun MLTextLine.toTextLine(): TextLine {
  return TextLine(
    text,
    boundingBox.toRect(),
    cornerPoints.toPoints(),
    recognizedLanguage.toLanguageCodes(),
    elements.map { element -> element.toTextElement() }.toTypedArray(),
  )
}

private fun MLTextBlock.toTextBlock(): TextBlock {
  return TextBlock(
    text,
    boundingBox.toRect(),
    cornerPoints.toPoints(),
    recognizedLanguage.toLanguageCodes(),
    lines.map { line -> line.toTextLine() }.toTypedArray(),
  )
}

fun Text.toRecognizedText(): RecognizedText {
  return RecognizedText(
    text,
    textBlocks.map { block -> block.toTextBlock() }.toTypedArray(),
  )
}

package com.margelo.nitro.camera.barcodescanner

import android.graphics.Matrix
import androidx.camera.core.ImageProxy

class BarcodeCoordinateSystemConverter(
  private val frameWidth: Double,
  private val frameHeight: Double,
  rotationDegrees: Int,
  sensorToBufferTransformMatrix: Matrix,
) {
  constructor(image: ImageProxy) : this(
    image.width.toDouble(),
    image.height.toDouble(),
    image.imageInfo.rotationDegrees,
    image.imageInfo.sensorToBufferTransformMatrix,
  )

  private val rotationDegrees = ((rotationDegrees % 360) + 360) % 360
  private val sensorToBufferTransformMatrix = Matrix(sensorToBufferTransformMatrix)
  private val bufferToSensorTransformMatrix =
    Matrix().apply {
      sensorToBufferTransformMatrix.invert(this)
    }

  init {
    require(
      this.rotationDegrees == 0 ||
        this.rotationDegrees == 90 ||
        this.rotationDegrees == 180 ||
        this.rotationDegrees == 270,
    ) {
      "rotationDegrees must be one of 0, 90, 180 or 270, but was $rotationDegrees!"
    }
  }

  fun convertBarcodePointToCameraPoint(barcodePoint: Point): Point {
    val framePoint = convertBarcodePointToFramePoint(barcodePoint)
    return bufferToSensorTransformMatrix.convertPoint(framePoint)
  }

  fun convertCameraPointToBarcodePoint(cameraPoint: Point): Point {
    val framePoint = sensorToBufferTransformMatrix.convertPoint(cameraPoint)
    return convertFramePointToBarcodePoint(framePoint)
  }

  private fun convertBarcodePointToFramePoint(barcodePoint: Point): Point {
    val x = barcodePoint.x
    val y = barcodePoint.y

    return when (rotationDegrees) {
      0 -> Point(x, y)
      90 -> Point(y, frameHeight - x)
      180 -> Point(frameWidth - x, frameHeight - y)
      270 -> Point(frameWidth - y, x)
      else -> error("unreachable")
    }
  }

  private fun convertFramePointToBarcodePoint(framePoint: Point): Point {
    val x = framePoint.x
    val y = framePoint.y

    return when (rotationDegrees) {
      0 -> Point(x, y)
      90 -> Point(frameHeight - y, x)
      180 -> Point(frameWidth - x, frameHeight - y)
      270 -> Point(y, frameWidth - x)
      else -> error("unreachable")
    }
  }

  private fun Matrix.convertPoint(point: Point): Point {
    val coordinates = floatArrayOf(point.x.toFloat(), point.y.toFloat())
    mapPoints(coordinates)
    return Point(coordinates[0].toDouble(), coordinates[1].toDouble())
  }
}

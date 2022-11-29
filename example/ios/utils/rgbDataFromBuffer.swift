//
//  rgbDataFromBuffer.swift
//  vision-camera-tflite-plugin
//
//  Created by Thomas Coldwell on 01/10/2022.
//  Reference: https://github.com/tensorflow/examples/blob/c191e26209ed71197e85bcf28c5afd0d8d630237/lite/examples/object_detection/ios/ObjectDetection/ModelDataHandler/ModelDataHandler.swift
//
import Foundation
import Accelerate

/// Returns the RGB data representation of the given image buffer with the specified `byteCount`.
///
/// - Parameters
///   - buffer: The pixel buffer to convert to RGB data.
///   - byteCount: The expected byte count for the RGB data calculated using the values that the
///       model was trained on: `batchSize * imageWidth * imageHeight * componentsCount`.
///   - isModelQuantized: Whether the model is quantized (i.e. fixed point values rather than
///       floating point values).
/// - Returns: The RGB data representation of the image buffer or `nil` if the buffer could not be
///     converted.
public func rgbDataFromBuffer(
  _ buffer: CVPixelBuffer,
  byteCount: Int,
  isModelQuantized: Bool
) -> Data? {
  CVPixelBufferLockBaseAddress(buffer, .readOnly)
  defer {
    CVPixelBufferUnlockBaseAddress(buffer, .readOnly)
  }
  guard let sourceData = CVPixelBufferGetBaseAddress(buffer) else {
    return nil
  }
  
  let width = CVPixelBufferGetWidth(buffer)
  let height = CVPixelBufferGetHeight(buffer)
  let sourceBytesPerRow = CVPixelBufferGetBytesPerRow(buffer)
  let destinationChannelCount = 3
  let destinationBytesPerRow = destinationChannelCount * width
  
  var sourceBuffer = vImage_Buffer(data: sourceData,
                                   height: vImagePixelCount(height),
                                   width: vImagePixelCount(width),
                                   rowBytes: sourceBytesPerRow)
  
  guard let destinationData = malloc(height * destinationBytesPerRow) else {
    print("Error: out of memory")
    return nil
  }
  
  defer {
    free(destinationData)
  }
  
  var destinationBuffer = vImage_Buffer(data: destinationData,
                                        height: vImagePixelCount(height),
                                        width: vImagePixelCount(width),
                                        rowBytes: destinationBytesPerRow)
  
  let pixelBufferFormat = CVPixelBufferGetPixelFormatType(buffer)
  
  switch (pixelBufferFormat) {
  case kCVPixelFormatType_32BGRA:
    vImageConvert_BGRA8888toRGB888(&sourceBuffer, &destinationBuffer, UInt32(kvImageNoFlags))
  case kCVPixelFormatType_32ARGB:
    vImageConvert_ARGB8888toRGB888(&sourceBuffer, &destinationBuffer, UInt32(kvImageNoFlags))
  case kCVPixelFormatType_32RGBA:
    vImageConvert_RGBA8888toRGB888(&sourceBuffer, &destinationBuffer, UInt32(kvImageNoFlags))
  default:
    // Unknown pixel format.
    return nil
  }
  
  let byteData = Data(bytes: destinationBuffer.data, count: destinationBuffer.rowBytes * height)
  if isModelQuantized {
    return byteData
  }
  
  // Not quantized, convert to floats
  let bytes = Array<UInt8>(unsafeData: byteData)!
  var floats = [Float]()
  for i in 0..<bytes.count {
    floats.append(Float(bytes[i]) / 255.0)
  }
  return Data(copyingBufferOf: floats)
}

// MARK: - Extensions
extension Data {
  /// Creates a new buffer by copying the buffer pointer of the given array.
  ///
  /// - Warning: The given array's element type `T` must be trivial in that it can be copied bit
  ///     for bit with no indirection or reference-counting operations; otherwise, reinterpreting
  ///     data from the resulting buffer has undefined behavior.
  /// - Parameter array: An array with elements of type `T`.
  init<T>(copyingBufferOf array: [T]) {
    self = array.withUnsafeBufferPointer(Data.init)
  }
}

extension Array {
  /// Creates a new array from the bytes of the given unsafe data.
  ///
  /// - Warning: The array's `Element` type must be trivial in that it can be copied bit for bit
  ///     with no indirection or reference-counting operations; otherwise, copying the raw bytes in
  ///     the `unsafeData`'s buffer to a new array returns an unsafe copy.
  /// - Note: Returns `nil` if `unsafeData.count` is not a multiple of
  ///     `MemoryLayout<Element>.stride`.
  /// - Parameter unsafeData: The data containing the bytes to turn into an array.
  init?(unsafeData: Data) {
    guard unsafeData.count % MemoryLayout<Element>.stride == 0 else { return nil }
#if swift(>=5.0)
    self = unsafeData.withUnsafeBytes { .init($0.bindMemory(to: Element.self)) }
#else
    self = unsafeData.withUnsafeBytes {
      .init(UnsafeBufferPointer<Element>(
        start: $0,
        count: unsafeData.count / MemoryLayout<Element>.stride
      ))
    }
#endif  // swift(>=5.0)
  }
}



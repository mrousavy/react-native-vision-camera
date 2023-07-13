//
//  FrameResizer.mm
//  VisionCamera
//
//  Created by Marc Rousavy on 29.06.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

#import "FrameResizer.h"
#import "ImageHelpers.h"
#import "TensorHelpers.h"

FrameResizer::FrameResizer(size_t targetWidth, size_t targetHeight, size_t channels, TFLTensorDataType dataType) {
  _targetWidth = targetWidth;
  _targetHeight = targetHeight;
  _targetChannels = channels;
  _targetDataType = dataType;
  
  // e.g. for RGB 8 bit we have 3 channels with data size of 1 (uint8_t)
  size_t dataSize = TensorHelpers::getTFLTensorDataTypeSize(dataType);
  _targetBytesPerRow = channels * dataSize * targetWidth;
  
  // Allocate a buffer that will hold the downscaled Frame in it's original pixel-format
  _inputDownscaledBuffer = (vImage_Buffer) {
    .data = nullptr,
    .width = 0,
    .height = 0,
    .rowBytes = 0
  };
  // Allocate a buffer that will hold the downscaled Frame in the converted target pixel-format
  _inputReformattedBuffer = (vImage_Buffer) {
    .data = malloc(_targetBytesPerRow * _targetHeight),
    .width = _targetWidth,
    .height = _targetHeight,
    .rowBytes = _targetBytesPerRow
  };
}

FrameResizer::~FrameResizer() {
  free(_inputDownscaledBuffer.data);
  free(_inputReformattedBuffer.data);
}

const vImage_Buffer& FrameResizer::resizeFrame(CVPixelBufferRef pixelBuffer) {
  CVPixelBufferLockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);
  
  OSType pixelFormatType = CVPixelBufferGetPixelFormatType(pixelBuffer);
  if (pixelFormatType != kCVPixelFormatType_32BGRA) {
    throw std::runtime_error(std::string("Frame has invalid Pixel Format! Expected: kCVPixelFormatType_32BGRA, received: ") + std::to_string(pixelFormatType));
  }
  
  vImage_Buffer srcBuffer = {
    .data = CVPixelBufferGetBaseAddress(pixelBuffer),
    .width = CVPixelBufferGetWidth(pixelBuffer),
    .height = CVPixelBufferGetHeight(pixelBuffer),
    .rowBytes = CVPixelBufferGetBytesPerRow(pixelBuffer)
  };
  
  // Crop Input Image buffer to fit tensor input aspect ratio (this only does pointer arithmetic, no copying)
  CGFloat scaleW = (float)srcBuffer.width / (float)_targetWidth;
  CGFloat scaleH = (float)srcBuffer.height / (float)_targetHeight;
  CGFloat scale = MIN(scaleW, scaleH);
  CGFloat cropWidth = _targetWidth * scale;
  CGFloat cropHeight = _targetHeight * scale;
  CGFloat cropTop = ((float)srcBuffer.height - cropHeight) / 2.0f;
  CGFloat cropLeft = ((float)srcBuffer.width - cropWidth) / 2.0f;
  CGRect cropRect = CGRectMake(cropLeft, cropTop, cropWidth, cropHeight);
  srcBuffer = ImageHelpers::vImageCropBuffer(srcBuffer, cropRect, srcBuffer.rowBytes * srcBuffer.height);
  
  // Downscaled Input Image to match Tensor Size, still in same pixel-format though
  size_t downscaledBytesPerRow = (float)srcBuffer.rowBytes / srcBuffer.width * _targetWidth;
  if (_inputDownscaledBuffer.rowBytes != downscaledBytesPerRow) {
    free(_inputDownscaledBuffer.data);
    _inputDownscaledBuffer = (vImage_Buffer) {
      .data = malloc(downscaledBytesPerRow * _targetHeight),
      .width = _targetWidth,
      .height = _targetHeight,
      .rowBytes = downscaledBytesPerRow
    };
  }
  vImage_Error imageError = vImageScale_ARGB8888(&srcBuffer, &_inputDownscaledBuffer, nil, kvImageNoFlags);
  if (imageError != kvImageNoError) {
    throw std::runtime_error("Failed to downscale input frame! Error: " + std::to_string(imageError));
  }
  
  switch (_targetDataType) {
    case TFLTensorDataTypeUInt8:
    case TFLTensorDataTypeInt8:
    case TFLTensorDataTypeInt16:
    case TFLTensorDataTypeInt32:
      if (_targetChannels == 3) {
        // Convert [255, 255, 255, 255] to [255, 255, 255]
        imageError = vImageConvert_BGRA8888toRGB888(&_inputDownscaledBuffer, &_inputReformattedBuffer, kvImageNoFlags);
      } else if (_targetChannels == 4) {
        // we are already using a 4-channel image; do nothing, just copy buffer over
        size_t dataTypeSize = TensorHelpers::getTFLTensorDataTypeSize(_targetDataType);
        vImageCopyBuffer(&_inputDownscaledBuffer, &_inputReformattedBuffer, dataTypeSize, kvImageNoFlags);
      } else {
        throw std::runtime_error("Invalid number of channels! I don't know how to convert a 4-channel frame to " + std::to_string(_targetChannels) + " channels.");
      }
      break;
    case TFLTensorDataTypeFloat32:
    case TFLTensorDataTypeFloat64:
      // Convert [255, 255, 255, 255] to [1.0, 1.0, 1.0]
      imageError = vImageConvert_16UToF(&_inputDownscaledBuffer, &_inputReformattedBuffer, 0.0f, 1.0f / 255.0f, kvImageNoFlags);
      break;
      
    case TFLTensorDataTypeFloat16:
    case TFLTensorDataTypeBool:
    case TFLTensorDataTypeInt64:
    default:
      throw std::runtime_error(std::string("Unsupported tensor data type! ") + std::to_string(_targetDataType));
  }
  if (imageError != kvImageNoError) {
    throw std::runtime_error("Failed to convert input frame to input tensor data! Error: " + std::to_string(imageError));
  }
  
  CVPixelBufferUnlockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);
  
  return _inputReformattedBuffer;
}

//
//  FrameResizer.h
//  VisionCamera
//
//  Created by Marc Rousavy on 29.06.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

#pragma once

#import <memory>
#import <Foundation/Foundation.h>
#import <Accelerate/Accelerate.h>
#import <AVFoundation/AVFoundation.h>
#import <TensorFlowLiteObjC/TFLTensorFlowLite.h>

class FrameResizer {
public:
  /**
   Create a new instance of the Frame Resizer. The Frame Resizer can resize incoming Frames to the given target width, height, and byte size.
   It uses Accelerate to downscale, crop, and re-sample Frames to the correct pixelformat.
   The constructor will allocate a few buffers used for internal steps.
   
   `targetWidth`: The width to resize all incoming frames to
   `targetHeight`: The height to resize all incoming frames to
   `channels`: The number of channels to use for the output. E.g. for RGB this should be 3, for RGBA this should be 4.
   `dataType`: The type of the output data as a Tensorflow type.
   
   Examples:
   - FrameResizer(192, 192, 3, TFLTensorDataTypeUInt8) will create a buffer with the size of 110.592
   - FrameResizer(192, 192, 3, TFLTensorDataTypeFloat32) will create a buffer with the size of 442.368
   */
  explicit FrameResizer(size_t targetWidth, size_t targetHeight, size_t channels, TFLTensorDataType dataType);
  ~FrameResizer();
  
  /**
   Resize the given Frame to the target dimensions and pixel formats.
   */
  const vImage_Buffer& resizeFrame(CVPixelBufferRef pixelBuffer);
  
private:
  vImage_Buffer _inputDownscaledBuffer;
  vImage_Buffer _inputReformattedBuffer;
  
  size_t _targetWidth;
  size_t _targetHeight;
  size_t _targetBytesPerRow;
};

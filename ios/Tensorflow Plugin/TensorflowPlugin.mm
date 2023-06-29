//
//  TensorflowPlugin.m
//  VisionCamera
//
//  Created by Marc Rousavy on 26.06.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

#import "TensorflowPlugin.h"
#import <Foundation/Foundation.h>

#import "../Frame Processor/FrameHostObject.h"
#import "../../cpp/JSITypedArray.h"

#import <TensorFlowLiteObjC/TFLTensorFlowLite.h>
#import <TensorFlowLiteObjC/TFLMetalDelegate.h>
#import <TensorFlowLiteObjC/TFLCoreMLDelegate.h>
#import <Accelerate/Accelerate.h>

@implementation TensorflowPlugin

using namespace facebook;
using namespace vision;

#define AdvancePtr( _ptr, _bytes) (__typeof__(_ptr))((uintptr_t)(_ptr) + (size_t)(_bytes))

static inline vImage_Buffer vImageCropBuffer(vImage_Buffer buf, CGRect where, size_t pixelBytes) {
  // from https://stackoverflow.com/a/74699324/5281431
  return (vImage_Buffer) {
    .data = AdvancePtr(buf.data, where.origin.y * buf.rowBytes + where.origin.x * pixelBytes),
    .height = (unsigned long) where.size.height,
    .width = (unsigned long) where.size.width,
    .rowBytes = buf.rowBytes
  };
}

/**
 Get the size of a value of the given `TFLTensorDataType`.
 */
size_t getTFLTensorDataTypeSize(TFLTensorDataType dataType) {
  switch (dataType) {
    case TFLTensorDataTypeUInt8:
      return sizeof(uint8_t);
    case TFLTensorDataTypeInt8:
      return sizeof(int8_t);
    case TFLTensorDataTypeInt16:
      return sizeof(int16_t);
    case TFLTensorDataTypeInt32:
      return sizeof(int32_t);
    case TFLTensorDataTypeFloat32:
      return sizeof(float32_t);
    case TFLTensorDataTypeFloat64:
      return sizeof(float64_t);
      
    case TFLTensorDataTypeFloat16:
    case TFLTensorDataTypeBool:
    case TFLTensorDataTypeInt64:
    default:
      throw std::runtime_error(std::string("Unsupported output data type! ") + std::to_string(dataType));
  }
}

/**
 Copies the given raw bytes array into a jsi::TypedArray.
 */
TypedArrayBase copyIntoJSBuffer(jsi::Runtime& runtime, TFLTensorDataType dataType, const void* buffer, size_t size) {
  switch (dataType) {
    case TFLTensorDataTypeUInt8:
      return TypedArray<TypedArrayKind::Uint8Array>(runtime, (uint8_t*)buffer, size);
    case TFLTensorDataTypeInt8:
      return TypedArray<TypedArrayKind::Int8Array>(runtime, (int8_t*)buffer, size);
    case TFLTensorDataTypeInt16:
      return TypedArray<TypedArrayKind::Int16Array>(runtime, (int16_t*)buffer, size);
    case TFLTensorDataTypeInt32:
      return TypedArray<TypedArrayKind::Int32Array>(runtime, (int32_t*)buffer, size);
    case TFLTensorDataTypeFloat32:
      return TypedArray<TypedArrayKind::Float32Array>(runtime, (float32_t*)buffer, size);
    case TFLTensorDataTypeFloat64:
      return TypedArray<TypedArrayKind::Float64Array>(runtime, (float64_t*)buffer, size);
      
    case TFLTensorDataTypeFloat16:
    case TFLTensorDataTypeBool:
    case TFLTensorDataTypeInt64:
    default:
      throw jsi::JSError(runtime, std::string("Unsupported output data type! ") + std::to_string(dataType));
  }
}

+ (void) installToRuntime:(facebook::jsi::Runtime &)runtime {
  auto func = jsi::Function::createFromHostFunction(runtime,
                                                    jsi::PropNameID::forAscii(runtime, "loadTensorflowModel"),
                                                    1,
                                                    [](jsi::Runtime& runtime,
                                                       const jsi::Value& thisValue,
                                                       const jsi::Value* arguments,
                                                       size_t count) -> jsi::Value {
    auto modelPath = arguments[0].asString(runtime).utf8(runtime);
    NSLog(@"Loading TensorFlow Lite Model from \"%s\"...", modelPath.c_str());
    
    auto delegates = [[NSMutableArray alloc] init];
    if (count > 1 && arguments[1].isString()) {
      // user passed a custom delegate command
      auto delegate = arguments[1].asString(runtime).utf8(runtime);
      if (delegate == "core-ml") {
        NSLog(@"Using CoreML delegate.");
        [delegates addObject:[[TFLCoreMLDelegate alloc] init]];
      } else if (delegate == "metal") {
        NSLog(@"Using Metal delegate.");
        [delegates addObject:[[TFLMetalDelegate alloc] init]];
      } else {
        NSLog(@"Using standard CPU delegate.");
      }
    }
    
    // TODO: Make this async / return a Promise
    
    
    // Write model to a local temp file
    NSURL* modelUrl = [[NSURL alloc] initWithString:[[NSString alloc] initWithUTF8String:modelPath.c_str()]];
    NSData* modelData = [NSData dataWithContentsOfURL:modelUrl];
    auto tempDirectory = [[NSFileManager defaultManager] temporaryDirectory];
    auto tempFileName = [NSString stringWithFormat:@"%@.tflite", [[NSUUID UUID] UUIDString]];
    auto tempFilePath = [tempDirectory URLByAppendingPathComponent:tempFileName].path;
    [modelData writeToFile:tempFilePath atomically:NO];
    NSLog(@"Model downloaded to \"%@\"! Loading into TensorFlow..", tempFilePath);
    
    NSError* error;
    TFLInterpreter* interpreter = [[TFLInterpreter alloc] initWithModelPath:tempFilePath
                                                                    options:[[TFLInterpreterOptions alloc] init]
                                                                  delegates:delegates
                                                                      error:&error];
    if (error != nil) {
      std::string str = std::string("Failed to load model \"") + tempFilePath.UTF8String + "\"! Error: " + [error.description UTF8String];
      throw jsi::JSError(runtime, str);
    }

    // Allocate memory for the model's input `TFLTensor`s.
    [interpreter allocateTensorsWithError:&error];
    if (error != nil) {
      std::string str = std::string("Failed to allocate memory for the model's input tensors! Error: ") + [error.description UTF8String];
      throw jsi::JSError(runtime, str);
    }
    
    // Get the input `TFLTensor`
    TFLTensor* inputTensor = [interpreter inputTensorAtIndex:0 error:&error];
    if (error != nil) {
      throw jsi::JSError(runtime, std::string("Failed to find input sensor for model! Error: ") + [error.description UTF8String]);
    }
    
    auto inputShape = [inputTensor shapeWithError:&error];
    if (error != nil) {
      throw jsi::JSError(runtime, std::string("Failed to get input sensor shape! Error: ") + [error.description UTF8String]);
    }
    
    unsigned long tensorStride_IDK = inputShape[0].unsignedLongValue;
    unsigned long tensorWidth = inputShape[1].unsignedLongValue;
    unsigned long tensorHeight = inputShape[2].unsignedLongValue;
    unsigned long tensorChannels = inputShape[3].unsignedLongValue;
    size_t tensorDataSize = getTFLTensorDataTypeSize(inputTensor.dataType);
    
    // Get the output `TFLTensor`
    TFLTensor* outputTensor = [interpreter outputTensorAtIndex:0 error:&error];
    if (error != nil) {
      throw jsi::JSError(runtime, std::string("Failed to get output sensor for model! Error: ") + [error.description UTF8String]);
    }
    
    auto outputShape = [outputTensor shapeWithError:&error];
    if (error != nil) {
      throw jsi::JSError(runtime, std::string("Failed to get output tensor shape! Error: ") + [error.description UTF8String]);
    }
    
    NSLog(@"Successfully loaded TensorFlow Lite Model!\n  Input Shape: %@, Type: %lu\n  Output Shape: %@, Type: %lu",
          inputShape, static_cast<unsigned long>(inputTensor.dataType), outputShape, static_cast<unsigned long>(outputTensor.dataType));
    
    auto runModel = jsi::Function::createFromHostFunction(runtime,
                                                          jsi::PropNameID::forAscii(runtime, "loadTensorflowModel"),
                                                          1,
                                                          [=](jsi::Runtime& runtime,
                                                                             const jsi::Value& thisValue,
                                                                             const jsi::Value* arguments,
                                                                             size_t count) -> jsi::Value {
      auto frame = arguments[0].asObject(runtime).asHostObject<FrameHostObject>(runtime);
      
      CVPixelBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(frame->frame.buffer);
      CVPixelBufferLockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);

      size_t width = CVPixelBufferGetWidth(pixelBuffer);
      size_t height = CVPixelBufferGetHeight(pixelBuffer);
      size_t bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer);
      OSType pixelFormatType = CVPixelBufferGetPixelFormatType(pixelBuffer);
      if (pixelFormatType != kCVPixelFormatType_32BGRA) {
        throw jsi::JSError(runtime, std::string("Frame has invalid Pixel Format! Expected: kCVPixelFormatType_32BGRA, received: ") + std::to_string(pixelFormatType));
      }
      
      // Get a pointer to the pixel buffer data
      CVPixelBufferLockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);
      void* baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer);

      // Input Image (Frame)
      vImage_Buffer srcBuffer = {
        .data = baseAddress,
        .width = width,
        .height = height,
        .rowBytes = bytesPerRow
      };
      
      
      // Crop Input Image buffer to fit tensor input aspect ratio - this is only doing some pointer arithmetic, no copying.
      CGFloat scaleW = (float)width / (float)tensorWidth;
      CGFloat scaleH = (float)height / (float)tensorHeight;
      CGFloat scale = MIN(scaleW, scaleH);
      CGFloat cropWidth = tensorWidth * scale;
      CGFloat cropHeight = tensorHeight * scale;
      CGFloat cropTop = ((float)height - cropHeight) / 2.0f;
      CGFloat cropLeft = ((float)width - cropWidth) / 2.0f;
      CGRect cropRect = CGRectMake(cropLeft, cropTop, cropWidth, cropHeight);
      srcBuffer = vImageCropBuffer(srcBuffer, cropRect, bytesPerRow * height);
      
      // Downscaled Input Image to match Tensor Size
      void* downscaledBuffer = malloc(bytesPerRow * tensorHeight);
      vImage_Buffer downscaledImageBuffer = {
        .data = downscaledBuffer,
        .width = tensorWidth,
        .height = tensorHeight,
        .rowBytes = bytesPerRow
      };
      // TODO: Use pre-allocated tempBuffer here
      vImage_Error imageError = vImageScale_ARGB8888(&srcBuffer, &downscaledImageBuffer, nil, kvImageNoFlags);
      if (imageError != kvImageNoError) {
        throw jsi::JSError(runtime, std::string("Failed to downscale input frame! Error: ") + std::to_string(imageError));
      }
      
      // Correctly transformed image for tensor pixel size/channels/format
      size_t tensorBytesPerRow = tensorWidth * tensorChannels * tensorDataSize;
      void* data = malloc(tensorBytesPerRow * tensorHeight);
      vImage_Buffer destBuffer = {
        .data = data,
        .width = tensorWidth,
        .height = tensorHeight,
        .rowBytes = tensorBytesPerRow
      };
      // Convert into correct pixel format and data type
      if (inputTensor.dataType != TFLTensorDataTypeUInt8) {
        throw jsi::JSError(runtime, std::string("Unsupported input tensor data type! ") + std::to_string(inputTensor.dataType));
      }
      // Convert [255, 255, 255, 255] to [255, 255, 255]
      imageError = vImageConvert_BGRA8888toRGB888(&downscaledImageBuffer, &destBuffer, kvImageNoFlags);
      if (imageError != kvImageNoError) {
        throw jsi::JSError(runtime, std::string("Failed to convert input frame to input tensor data! Error: ") + std::to_string(imageError));
      }
      
      NSError* error;
      // Copy the input data to the input `TFLTensor`.
      auto nsData = [NSData dataWithBytes:data length:tensorBytesPerRow * tensorHeight];
      [inputTensor copyData:nsData error:&error];
      if (error != nil) {
        throw jsi::JSError(runtime, std::string("Failed to copy input data to model! Error: ") + [error.description UTF8String]);
      }
      
      // Run inference by invoking the `TFLInterpreter`.
      [interpreter invokeWithError:&error];
      if (error != nil) {
        throw jsi::JSError(runtime, std::string("Failed to run model! Error: ") + [error.description UTF8String]);
      }
      
      // Copy output to `NSData` to process the inference results.
      NSData* outputData = [outputTensor dataWithError:&error];
      if (error != nil) {
        throw jsi::JSError(runtime, std::string("Failed to copy output data from model! Error: ") + [error.description UTF8String]);
      }
      
      free(downscaledBuffer);
      free(data);
      CVPixelBufferUnlockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);
      
      jsi::Array result(runtime, outputShape.count);
      size_t offset = 0;
      for (size_t i = 0; i < outputShape.count; i++) {
        size_t size = outputShape[i].intValue;
        NSData* slice = [outputData subdataWithRange:NSMakeRange(offset, size)];
        auto typedArray = copyIntoJSBuffer(runtime, outputTensor.dataType, slice.bytes, slice.length);
        result.setValueAtIndex(runtime, i, typedArray.getBuffer(runtime));
        offset += size;
      }
      
      return result;
    });
    return runModel;
  });
  
  runtime.global().setProperty(runtime, "loadTensorflowModel", func);
}

@end

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

/**
 Copies the given raw bytes array into a jsi::TypedArray.
 */
TypedArrayBase copyIntoJSBuffer(jsi::Runtime& runtime, TFLTensorDataType dataType, const void* buffer, size_t size) {
  switch (dataType) {
    case TFLTensorDataTypeUInt8:
      return TypedArray<TypedArrayKind::Uint8Array>(runtime, (UInt8*)buffer, size);
    case TFLTensorDataTypeInt8:
      return TypedArray<TypedArrayKind::Int8Array>(runtime, (int8_t*)buffer, size);
    case TFLTensorDataTypeInt16:
      return TypedArray<TypedArrayKind::Int16Array>(runtime, (int16_t*)buffer, size);
    case TFLTensorDataTypeInt32:
      return TypedArray<TypedArrayKind::Int32Array>(runtime, (int32_t*)buffer, size);
    case TFLTensorDataTypeFloat32:
      return TypedArray<TypedArrayKind::Float32Array>(runtime, (Float32*)buffer, size);
    case TFLTensorDataTypeFloat64:
      return TypedArray<TypedArrayKind::Float64Array>(runtime, (Float64*)buffer, size);
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
    
    auto delegates = [[NSMutableArray alloc] init];
    if (count > 1 && arguments[1].isString()) {
      // user passed a custom delegate command
      auto delegate = arguments[1].asString(runtime).utf8(runtime);
      if (delegate == "core-ml") {
        [delegates addObject:[[TFLCoreMLDelegate alloc] init]];
      } else if (delegate == "metal") {
        [delegates addObject:[[TFLMetalDelegate alloc] init]];
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
    
    auto shape = [inputTensor shapeWithError:&error];
    if (error != nil) {
      throw jsi::JSError(runtime, std::string("Failed to get input sensor shape! Error: ") + [error.description UTF8String]);
    }
    
    unsigned long tensorStride_IDK = shape[0].unsignedLongValue;
    unsigned long tensorWidth = shape[1].unsignedLongValue;
    unsigned long tensorHeight = shape[2].unsignedLongValue;
    unsigned long tensorChannels = shape[3].unsignedLongValue;
    
    // Get the output `TFLTensor`
    TFLTensor* outputTensor = [interpreter outputTensorAtIndex:0 error:&error];
    if (error != nil) {
      throw jsi::JSError(runtime, std::string("Failed to get output sensor for model! Error: ") + [error.description UTF8String]);
    }
    
    auto outputShape = [outputTensor shapeWithError:&error];
    if (error != nil) {
      throw jsi::JSError(runtime, std::string("Failed to get output tensor shape! Error: ") + [error.description UTF8String]);
    }
    
    auto outputDataType = [outputTensor dataType];
    
    NSLog(@"Successfully loaded TensorFlowLite Model! Output Data Type: %lu",  static_cast<unsigned long>(outputDataType));
    
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

      // TODO: multiply by tensorStride?
      size_t tensorBytesPerRow = tensorWidth * tensorChannels;

      // Get a pointer to the pixel buffer data
      CVPixelBufferLockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);
      void* baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer);

      // Create a vImage buffer referencing the pixel buffer data
      vImage_Buffer srcBuffer = {
          .data = baseAddress,
          .width = width,
          .height = height,
          .rowBytes = bytesPerRow
      };
      
      void* data = malloc(tensorBytesPerRow * tensorHeight);

      // Create a vImage buffer for the destination (input tensor) data
      vImage_Buffer destBuffer = {
          .data = data,
          .width = tensorWidth,
          .height = tensorHeight,
          .rowBytes = tensorBytesPerRow
      };

      // Perform the color conversion (if needed) and copy the pixel data to the input tensor buffer
      if (pixelFormatType == kCVPixelFormatType_32BGRA) {
          // Convert 32BGRA to RGB
          vImage_Error error = vImageConvert_BGRA8888toRGB888(&srcBuffer, &destBuffer, kvImageNoFlags);
          
          if (error == kvImageNoError) {
              // Data conversion successful
          } else {
            throw jsi::JSError(runtime, std::string("Failed to convert Frame to Data! Error: ") + std::to_string(error));
          }
      } else {
        throw jsi::JSError(runtime, std::string("Frame has invalid Pixel Format! Expected: kCVPixelFormatType_32BGRA, received: ") + std::to_string(pixelFormatType));
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
      
      free(data);
      CVPixelBufferUnlockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);
      
      jsi::Array result(runtime, outputShape.count);
      size_t offset = 0;
      for (size_t i = 0; i < outputShape.count; i++) {
        size_t size = outputShape[i].intValue;
        NSData* slice = [outputData subdataWithRange:NSMakeRange(offset, size)];
        result.setValueAtIndex(runtime, i, copyIntoJSBuffer(runtime, outputDataType, slice.bytes, slice.length));
        offset += size;
      }
      
      return result;
    });
    return runModel;
  });
  
  runtime.global().setProperty(runtime, "loadTensorflowModel", func);
}

@end

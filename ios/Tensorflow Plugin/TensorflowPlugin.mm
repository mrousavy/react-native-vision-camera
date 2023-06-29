//
//  TensorflowPlugin.m
//  VisionCamera
//
//  Created by Marc Rousavy on 26.06.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

#import "TensorflowPlugin.h"
#import <Foundation/Foundation.h>

#import "ImageHelpers.h"
#import "TensorHelpers.h"
#import "../Frame Processor/FrameHostObject.h"
#import "../../cpp/JSITypedArray.h"

#import <TensorFlowLiteObjC/TFLTensorFlowLite.h>
#import <TensorFlowLiteObjC/TFLMetalDelegate.h>
#import <TensorFlowLiteObjC/TFLCoreMLDelegate.h>
#import <Accelerate/Accelerate.h>

using namespace facebook;
using namespace vision;


void TensorflowPlugin::installToRuntime(jsi::Runtime& runtime) {
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
    
    auto plugin = std::make_shared<TensorflowPlugin>(runtime, interpreter);
    return jsi::Object::createFromHostObject(runtime, plugin);
  });
  
  runtime.global().setProperty(runtime, "loadTensorflowModel", func);
}


TensorflowPlugin::TensorflowPlugin(jsi::Runtime& runtime, TFLInterpreter* interpreter): _interpreter(interpreter) {
  NSError* error;
  
  // Allocate memory for the model's input `TFLTensor`s.
  [interpreter allocateTensorsWithError:&error];
  if (error != nil) {
    throw jsi::JSError(runtime, std::string("Failed to allocate memory for the model's input tensors! Error: ") + [error.description UTF8String]);
  }
  
  // Get the input `TFLTensor`
  _inputTensor = [interpreter inputTensorAtIndex:0 error:&error];
  if (error != nil) {
    throw jsi::JSError(runtime, std::string("Failed to find input sensor for model! Error: ") + [error.description UTF8String]);
  }
  
  auto inputShape = [_inputTensor shapeWithError:&error];
  if (error != nil) {
    throw jsi::JSError(runtime, std::string("Failed to get input sensor shape! Error: ") + [error.description UTF8String]);
  }
  
  _inputWidth = inputShape[1].unsignedLongValue;
  _inputHeight = inputShape[2].unsignedLongValue;
  _inputChannels = inputShape[3].unsignedLongValue;
  _inputDataSize = TensorHelpers::getTFLTensorDataTypeSize(_inputTensor.dataType);
  
  // Get the output `TFLTensor`
  _outputTensor = [interpreter outputTensorAtIndex:0 error:&error];
  if (error != nil) {
    throw jsi::JSError(runtime, std::string("Failed to get output sensor for model! Error: ") + [error.description UTF8String]);
  }
  
  _outputDataSize = TensorHelpers::getTFLTensorDataTypeSize(_outputTensor.dataType);
  _outputShape = [_outputTensor shapeWithError:&error];
  if (error != nil) {
    throw jsi::JSError(runtime, std::string("Failed to get output tensor shape! Error: ") + [error.description UTF8String]);
  }
  
  NSLog(@"Successfully loaded TensorFlow Lite Model!\n  Input Shape: %@, Type: %lu\n  Output Shape: %@, Type: %lu",
        inputShape, static_cast<unsigned long>(_inputTensor.dataType), _outputShape, static_cast<unsigned long>(_outputTensor.dataType));
}

TensorflowPlugin::~TensorflowPlugin() {
  // TODO: Clean up buffers here
}


jsi::Value TensorflowPlugin::run(jsi::Runtime &runtime, Frame* frame) {
  CVPixelBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
  CVPixelBufferLockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);
  
  size_t width = CVPixelBufferGetWidth(pixelBuffer);
  size_t height = CVPixelBufferGetHeight(pixelBuffer);
  size_t bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer);
  OSType pixelFormatType = CVPixelBufferGetPixelFormatType(pixelBuffer);
  if (pixelFormatType != kCVPixelFormatType_32BGRA) {
    throw jsi::JSError(runtime, std::string("Frame has invalid Pixel Format! Expected: kCVPixelFormatType_32BGRA, received: ") + std::to_string(pixelFormatType));
  }
  
  // Input Image (Frame)
  CVPixelBufferLockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);
  void* baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer);
  vImage_Buffer srcBuffer = {
    .data = baseAddress,
    .width = width,
    .height = height,
    .rowBytes = bytesPerRow
  };
  
  // Crop Input Image buffer to fit tensor input aspect ratio
  CGFloat scaleW = (float)width / (float)_inputWidth;
  CGFloat scaleH = (float)height / (float)_inputHeight;
  CGFloat scale = MIN(scaleW, scaleH);
  CGFloat cropWidth = _inputWidth * scale;
  CGFloat cropHeight = _inputHeight * scale;
  CGFloat cropTop = ((float)height - cropHeight) / 2.0f;
  CGFloat cropLeft = ((float)width - cropWidth) / 2.0f;
  CGRect cropRect = CGRectMake(cropLeft, cropTop, cropWidth, cropHeight);
  srcBuffer = ImageHelpers::vImageCropBuffer(srcBuffer, cropRect, bytesPerRow * height);
  
  // Downscaled Input Image to match Tensor Size
  void* downscaledBuffer = malloc(bytesPerRow * _inputHeight);
  vImage_Buffer downscaledImageBuffer = {
    .data = downscaledBuffer,
    .width = _inputWidth,
    .height = _inputHeight,
    .rowBytes = bytesPerRow
  };
  // TODO: Use pre-allocated tempBuffer here
  vImage_Error imageError = vImageScale_ARGB8888(&srcBuffer, &downscaledImageBuffer, nil, kvImageNoFlags);
  if (imageError != kvImageNoError) {
    throw jsi::JSError(runtime, std::string("Failed to downscale input frame! Error: ") + std::to_string(imageError));
  }
  
  // Correctly transformed image for tensor pixel size/channels/format
  size_t tensorBytesPerRow = _inputHeight * _inputChannels * _inputDataSize;
  void* data = malloc(tensorBytesPerRow * _inputHeight);
  vImage_Buffer destBuffer = {
    .data = data,
    .width = _inputWidth,
    .height = _inputHeight,
    .rowBytes = tensorBytesPerRow
  };
  // Convert into correct pixel format and data type
  if (_inputTensor.dataType != TFLTensorDataTypeUInt8) {
    throw jsi::JSError(runtime, std::string("Unsupported input tensor data type! ") + std::to_string(_inputTensor.dataType));
  }
  // Convert [255, 255, 255, 255] to [255, 255, 255]
  imageError = vImageConvert_BGRA8888toRGB888(&downscaledImageBuffer, &destBuffer, kvImageNoFlags);
  if (imageError != kvImageNoError) {
    throw jsi::JSError(runtime, std::string("Failed to convert input frame to input tensor data! Error: ") + std::to_string(imageError));
  }
  
  NSError* error;
  // Copy the input data to the input `TFLTensor`.
  auto nsData = [NSData dataWithBytes:data length:tensorBytesPerRow * _inputHeight];
  [_inputTensor copyData:nsData error:&error];
  if (error != nil) {
    throw jsi::JSError(runtime, std::string("Failed to copy input data to model! Error: ") + [error.description UTF8String]);
  }
  
  // Run inference by invoking the `TFLInterpreter`.
  [_interpreter invokeWithError:&error];
  if (error != nil) {
    throw jsi::JSError(runtime, std::string("Failed to run model! Error: ") + [error.description UTF8String]);
  }
  
  // Copy output to `NSData` to process the inference results.
  NSData* outputData = [_outputTensor dataWithError:&error];
  if (error != nil) {
    throw jsi::JSError(runtime, std::string("Failed to copy output data from model! Error: ") + [error.description UTF8String]);
  }
  
  free(downscaledBuffer);
  free(data);
  CVPixelBufferUnlockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);
  
  jsi::Array result(runtime, _outputShape.count);
  size_t offset = 0;
  for (size_t i = 0; i < _outputShape.count; i++) {
    // TODO: Correctly get size for those arrays
    size_t outputDataSize = TensorHelpers::getTFLTensorDataTypeSize(_outputTensor.dataType);
    size_t size = _outputShape[i].intValue * outputDataSize;
    NSData* slice = [outputData subdataWithRange:NSMakeRange(offset, size)];
    TypedArrayBase typedArray = TensorHelpers::copyIntoJSBuffer(runtime, _outputTensor.dataType, slice.bytes, slice.length / outputDataSize);
    result.setValueAtIndex(runtime, i, typedArray);
    offset += size;
  }
  
  return result;
}

jsi::Value TensorflowPlugin::get(jsi::Runtime& runtime, const jsi::PropNameID& propNameId) {
  auto propName = propNameId.utf8(runtime);
  
  if (propName == "run") {
    return jsi::Function::createFromHostFunction(runtime,
                                                 jsi::PropNameID::forAscii(runtime, "runModel"),
                                                 1,
                                                 [=](jsi::Runtime& runtime,
                                                     const jsi::Value& thisValue,
                                                     const jsi::Value* arguments,
                                                     size_t count) -> jsi::Value {
      auto frame = arguments[0].asObject(runtime).asHostObject<FrameHostObject>(runtime);
      return this->run(runtime, frame->frame);
    });
  }
  
  return jsi::HostObject::get(runtime, propNameId);
}


std::vector<jsi::PropNameID> TensorflowPlugin::getPropertyNames(jsi::Runtime& runtime) {
  std::vector<jsi::PropNameID> result;
  result.push_back(jsi::PropNameID::forAscii(runtime, "run"));
  return result;
}

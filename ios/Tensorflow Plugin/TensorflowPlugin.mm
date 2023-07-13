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
#include <ReactCommon/TurboModuleUtils.h>

using namespace facebook;
using namespace vision;


void TensorflowPlugin::installToRuntime(jsi::Runtime& runtime, std::shared_ptr<react::CallInvoker> callInvoker) {
  auto func = jsi::Function::createFromHostFunction(runtime,
                                                    jsi::PropNameID::forAscii(runtime, "__loadTensorflowModel"),
                                                    1,
                                                    [=](jsi::Runtime& runtime,
                                                        const jsi::Value& thisValue,
                                                        const jsi::Value* arguments,
                                                        size_t count) -> jsi::Value {
    CFTimeInterval startTime = CACurrentMediaTime();
    auto modelPath = arguments[0].asString(runtime).utf8(runtime);
    NSLog(@"Loading TensorFlow Lite Model from \"%s\"...", modelPath.c_str());
    
    auto delegates = [[NSMutableArray alloc] init];
    Delegate delegate = Delegate::Default;
    if (count > 1 && arguments[1].isString()) {
      // user passed a custom delegate command
      auto delegate = arguments[1].asString(runtime).utf8(runtime);
      if (delegate == "core-ml") {
        NSLog(@"Using CoreML delegate.");
        [delegates addObject:[[TFLCoreMLDelegate alloc] init]];
        delegate = Delegate::CoreML;
      } else if (delegate == "metal") {
        NSLog(@"Using Metal delegate.");
        [delegates addObject:[[TFLMetalDelegate alloc] init]];
        delegate = Delegate::Metal;
      } else {
        NSLog(@"Using standard CPU delegate.");
        delegate = Delegate::Default;
      }
    }
    
    auto promise = react::createPromiseAsJSIValue(runtime, [=](jsi::Runtime &runtime,
                                                               std::shared_ptr<react::Promise> promise) -> void {
      dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        // Download Model from JS bundle to local file
        NSURL* modelUrl = [[NSURL alloc] initWithString:[[NSString alloc] initWithUTF8String:modelPath.c_str()]];
        NSData* modelData = [NSData dataWithContentsOfURL:modelUrl];
        auto tempDirectory = [[NSFileManager defaultManager] temporaryDirectory];
        auto tempFileName = [NSString stringWithFormat:@"%@.tflite", [[NSUUID UUID] UUIDString]];
        auto tempFilePath = [tempDirectory URLByAppendingPathComponent:tempFileName].path;
        [modelData writeToFile:tempFilePath atomically:NO];
        NSLog(@"Model downloaded to \"%@\"! Loading into TensorFlow..", tempFilePath);
        
        // Load Model into Tensorflow
        NSError* error;
        TFLInterpreter* interpreter = [[TFLInterpreter alloc] initWithModelPath:tempFilePath
                                                                        options:[[TFLInterpreterOptions alloc] init]
                                                                      delegates:delegates
                                                                          error:&error];
        if (error != nil) {
          std::string str = std::string("Failed to load model \"") + tempFilePath.UTF8String + "\"! Error: " + [error.description UTF8String];
          promise->reject(str);
          return;
        }
        
        // Initialize Model and allocate memory buffers
        auto plugin = std::make_shared<TensorflowPlugin>(interpreter, delegate);
        
        // Resolve Promise back on JS Thread
        callInvoker->invokeAsync([=]() {
          auto hostObject = jsi::Object::createFromHostObject(promise->runtime_, plugin);
          promise->resolve(std::move(hostObject));
          
          CFTimeInterval endTime = CACurrentMediaTime();
          NSLog(@"Successfully loaded Tensorflow Model in %g s!", endTime - startTime);
        });
      });
    });
    return promise;
  });
  
  runtime.global().setProperty(runtime, "__loadTensorflowModel", func);
}


TensorflowPlugin::TensorflowPlugin(TFLInterpreter* interpreter, Delegate delegate): _interpreter(interpreter), _delegate(delegate) {
  NSError* error;
  
  // Allocate memory for the model's input `TFLTensor`s.
  [interpreter allocateTensorsWithError:&error];
  if (error != nil) {
    throw std::runtime_error(std::string("Failed to allocate memory for the model's input tensors! Error: ") + [error.description UTF8String]);
  }
  
  // Get the input `TFLTensor`
  _inputTensor = [interpreter inputTensorAtIndex:0 error:&error];
  if (error != nil) {
    throw std::runtime_error(std::string("Failed to find input sensor for model! Error: ") + [error.description UTF8String]);
  }
  
  auto inputShape = [_inputTensor shapeWithError:&error];
  if (error != nil) {
    throw std::runtime_error(std::string("Failed to get input tensor shape! Error: ") + [error.description UTF8String]);
  }
  
  auto inputWidth = inputShape[1].unsignedLongValue;
  auto inputHeight = inputShape[2].unsignedLongValue;
  auto inputChannels = inputShape[3].unsignedLongValue;
  _frameResizer = std::make_shared<FrameResizer>(inputWidth, inputHeight, inputChannels, _inputTensor.dataType);
  
  NSLog(@"Successfully loaded TensorFlow Lite Model! Input Shape: %@, Type: %lu",
        inputShape, static_cast<unsigned long>(_inputTensor.dataType));
}

TensorflowPlugin::~TensorflowPlugin() {
  // TODO: Clean up buffers here
}

std::shared_ptr<TypedArrayBase> TensorflowPlugin::getOutputArrayForTensor(jsi::Runtime& runtime, TFLTensor* tensor) {
  auto name = std::string(tensor.name.UTF8String);
  if (_outputBuffers.find(name) == _outputBuffers.end()) {
    _outputBuffers[name] = std::make_shared<TypedArrayBase>(TensorHelpers::createJSBufferForTensor(runtime, tensor));
  }
  return _outputBuffers[name];
}

jsi::Value TensorflowPlugin::run(jsi::Runtime &runtime, Frame* frame) {
  CVPixelBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
  
  vImage_Buffer resizedFrame = _frameResizer->resizeFrame(pixelBuffer);
  
  NSError* error;
  // Copy the input data to the input `TFLTensor`.
  auto nsData = [NSData dataWithBytes:resizedFrame.data
                               length:resizedFrame.rowBytes * resizedFrame.height];
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
  size_t outputTensorsCount = _interpreter.outputTensorCount;
  jsi::Array result(runtime, outputTensorsCount);
  for (size_t i = 0; i < outputTensorsCount; i++) {
    TFLTensor* outputTensor = [_interpreter outputTensorAtIndex:i error:&error];
    if (error != nil) {
      throw jsi::JSError(runtime, std::string("Failed to get output tensor! Error: ") + [error.description UTF8String]);
    }
    auto outputBuffer = getOutputArrayForTensor(runtime, outputTensor);
    TensorHelpers::updateJSBuffer(runtime, *outputBuffer, outputTensor);
    result.setValueAtIndex(runtime, i, *outputBuffer);
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
  } else if (propName == "inputs") {
    jsi::Array tensors(runtime, _interpreter.inputTensorCount);
    for (size_t i = 0; i < _interpreter.inputTensorCount; i++) {
      NSError* error;
      TFLTensor* tensor = [_interpreter inputTensorAtIndex:i error:&error];
      if (error != nil) {
        throw jsi::JSError(runtime, "Failed to get input tensor " + std::to_string(i) + "! " + error.description.UTF8String);
      }
      
      jsi::Object object = TensorHelpers::tensorToJSObject(runtime, tensor);
      tensors.setValueAtIndex(runtime, i, object);
    }
    return tensors;
  } else if (propName == "outputs") {
    jsi::Array tensors(runtime, _interpreter.outputTensorCount);
    for (size_t i = 0; i < _interpreter.outputTensorCount; i++) {
      NSError* error;
      TFLTensor* tensor = [_interpreter outputTensorAtIndex:i error:&error];
      if (error != nil) {
        throw jsi::JSError(runtime, "Failed to get output tensor " + std::to_string(i) + "! " + error.description.UTF8String);
      }
      
      jsi::Object object = TensorHelpers::tensorToJSObject(runtime, tensor);
      tensors.setValueAtIndex(runtime, i, object);
    }
    return tensors;
  } else if (propName == "delegate") {
    switch (_delegate) {
      case Delegate::Default:
        return jsi::String::createFromUtf8(runtime, "default");
      case Delegate::CoreML:
        return jsi::String::createFromUtf8(runtime, "coreml");
      case Delegate::Metal:
        return jsi::String::createFromUtf8(runtime, "metal");
    }
  }
  
  return jsi::HostObject::get(runtime, propNameId);
}


std::vector<jsi::PropNameID> TensorflowPlugin::getPropertyNames(jsi::Runtime& runtime) {
  std::vector<jsi::PropNameID> result;
  result.push_back(jsi::PropNameID::forAscii(runtime, "run"));
  result.push_back(jsi::PropNameID::forAscii(runtime, "inputs"));
  result.push_back(jsi::PropNameID::forAscii(runtime, "outputs"));
  result.push_back(jsi::PropNameID::forAscii(runtime, "delegate"));
  return result;
}

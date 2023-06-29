//
//  TensorflowPlugin.h
//  VisionCamera
//
//  Created by Marc Rousavy on 26.06.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

#pragma once

#import <jsi/jsi.h>
#import <TensorFlowLiteObjC/TFLTensorFlowLite.h>
#import "../Frame Processor/Frame.h"

using namespace facebook;

class TensorflowPlugin: public jsi::HostObject {
public:
  explicit TensorflowPlugin(jsi::Runtime& runtime, TFLInterpreter* interpreter);
  ~TensorflowPlugin();
  
  jsi::Value get(jsi::Runtime& runtime, const jsi::PropNameID& name) override;
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& runtime) override;
  
  jsi::Value run(jsi::Runtime& runtime, Frame* frame);
  
  
  static void installToRuntime(jsi::Runtime& runtime);
  
private:
  TFLInterpreter* _interpreter = nil;
  TFLTensor* _inputTensor = nil;
  unsigned long _inputWidth = 0;
  unsigned long _inputHeight = 0;
  unsigned long _inputChannels = 0;
  unsigned long _inputDataSize = 0;
  
  TFLTensor* _outputTensor = nil;
  NSArray<NSNumber*>* _outputShape = nil;
  unsigned long _outputDataSize = 0;
};

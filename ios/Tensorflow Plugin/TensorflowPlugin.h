//
//  TensorflowPlugin.h
//  VisionCamera
//
//  Created by Marc Rousavy on 26.06.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

#pragma once

#import <memory>
#import <unordered_map>
#import <jsi/jsi.h>
#import <TensorFlowLiteObjC/TFLTensorFlowLite.h>
#import "../Frame Processor/Frame.h"
#import "FrameResizer.h"
#import <React-callinvoker/ReactCommon/CallInvoker.h>
#import "../../cpp/JSITypedArray.h"

using namespace facebook;
using namespace vision;

class TensorflowPlugin: public jsi::HostObject {
public:
  // TFL Delegate Type
  enum Delegate { Default, Metal, CoreML };

public:
  explicit TensorflowPlugin(TFLInterpreter* interpreter, Delegate delegate);
  ~TensorflowPlugin();

  jsi::Value get(jsi::Runtime& runtime, const jsi::PropNameID& name) override;
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& runtime) override;

  static void installToRuntime(jsi::Runtime& runtime, std::shared_ptr<react::CallInvoker> callInvoker);

private:
  jsi::Value run(jsi::Runtime& runtime, Frame* frame);
  std::shared_ptr<TypedArrayBase> getOutputArrayForTensor(jsi::Runtime& runtime, TFLTensor* tensor);

private:
  TFLInterpreter* _interpreter = nil;
  std::shared_ptr<FrameResizer> _frameResizer;
  Delegate _delegate = Delegate::Default;

  TFLTensor* _inputTensor = nil;
  std::unordered_map<std::string, std::shared_ptr<TypedArrayBase>> _outputBuffers;
};

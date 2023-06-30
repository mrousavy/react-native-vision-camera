//
//  TensorHelpers.h
//  VisionCamera
//
//  Created by Marc Rousavy on 29.06.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

#pragma once

#import <Foundation/Foundation.h>
#import <TensorFlowLiteObjC/TFLTensorFlowLite.h>
#import <jsi/jsi.h>
#import "../../cpp/JSITypedArray.h"

class TensorHelpers {
public:
  /**
   Get the size of a value of the given `TFLTensorDataType`.
   */
  static size_t getTFLTensorDataTypeSize(TFLTensorDataType dataType);
  /**
   Create a pre-allocated TypedArray for the given TFLTensor.
   */
  static vision::TypedArrayBase createJSBufferForTensor(jsi::Runtime& runtime, TFLTensor* tensor);
  /**
   Copies the Tensor's data into a jsi::TypedArray and correctly casts to the given type.
   */
  static void updateJSBuffer(jsi::Runtime& runtime, vision::TypedArrayBase& jsBuffer, TFLTensor* tensor);
  
  static jsi::Object tensorToJSObject(jsi::Runtime& runtime, TFLTensor* tensor);
};

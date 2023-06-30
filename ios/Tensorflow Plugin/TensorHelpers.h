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
   Copies the given raw bytes array into a jsi::TypedArray.
   */
  static vision::TypedArrayBase copyIntoJSBuffer(jsi::Runtime& runtime, TFLTensorDataType dataType, const void* buffer, size_t size);
  
  /**
   Copies the given raw bytes array into a jsi::TypedArray and correctly casts to the given type.
   */
  static void updateJSBuffer(jsi::Runtime& runtime, jsi::Object boxedJSBuffer, TFLTensorDataType dataType, const void* buffer, size_t size);
  
  static jsi::Object tensorToJSObject(jsi::Runtime& runtime, TFLTensor* tensor);
};

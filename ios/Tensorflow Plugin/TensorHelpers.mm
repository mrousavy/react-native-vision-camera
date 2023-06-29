//
//  TensorHelpers.mm
//  VisionCamera
//
//  Created by Marc Rousavy on 29.06.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

#import "TensorHelpers.h"
#import <Foundation/Foundation.h>
#import <Accelerate/Accelerate.h>

using namespace vision;

size_t TensorHelpers::getTFLTensorDataTypeSize(TFLTensorDataType dataType) {
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

TypedArrayBase TensorHelpers::copyIntoJSBuffer(jsi::Runtime& runtime, TFLTensorDataType dataType, const void* buffer, size_t size) {
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

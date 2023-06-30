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
  size_t dataTypeSize = getTFLTensorDataTypeSize(dataType);
  switch (dataType) {
    case TFLTensorDataTypeUInt8:
      return TypedArray<TypedArrayKind::Uint8Array>(runtime, (uint8_t*)buffer, size / dataTypeSize);
    case TFLTensorDataTypeInt8:
      return TypedArray<TypedArrayKind::Int8Array>(runtime, (int8_t*)buffer, size / dataTypeSize);
    case TFLTensorDataTypeInt16:
      return TypedArray<TypedArrayKind::Int16Array>(runtime, (int16_t*)buffer, size / dataTypeSize);
    case TFLTensorDataTypeInt32:
      return TypedArray<TypedArrayKind::Int32Array>(runtime, (int32_t*)buffer, size / dataTypeSize);
    case TFLTensorDataTypeFloat32:
      return TypedArray<TypedArrayKind::Float32Array>(runtime, (float32_t*)buffer, size / dataTypeSize);
    case TFLTensorDataTypeFloat64:
      return TypedArray<TypedArrayKind::Float64Array>(runtime, (float64_t*)buffer, size / dataTypeSize);
      
    case TFLTensorDataTypeFloat16:
    case TFLTensorDataTypeBool:
    case TFLTensorDataTypeInt64:
    default:
      throw jsi::JSError(runtime, std::string("Unsupported output data type! ") + std::to_string(dataType));
  }
}

void TensorHelpers::updateJSBuffer(jsi::Runtime& runtime, jsi::Object boxedJSBuffer, TFLTensorDataType dataType, const void* buffer, size_t size) {
  switch (dataType) {
    case TFLTensorDataTypeUInt8:
      getTypedArray(runtime, boxedJSBuffer)
        .as<TypedArrayKind::Uint8Array>(runtime)
        .updateUnsafe(runtime, (uint8_t*)buffer, size);
      break;
    case TFLTensorDataTypeInt8:
      getTypedArray(runtime, boxedJSBuffer)
        .as<TypedArrayKind::Int8Array>(runtime)
        .updateUnsafe(runtime, (int8_t*)buffer, size);
      break;
    case TFLTensorDataTypeInt16:
      getTypedArray(runtime, boxedJSBuffer)
        .as<TypedArrayKind::Int16Array>(runtime)
        .updateUnsafe(runtime, (int16_t*)buffer, size);
      break;
    case TFLTensorDataTypeInt32:
      getTypedArray(runtime, boxedJSBuffer)
        .as<TypedArrayKind::Int32Array>(runtime)
        .updateUnsafe(runtime, (int32_t*)buffer, size);
      break;
    case TFLTensorDataTypeFloat32:
      getTypedArray(runtime, boxedJSBuffer)
        .as<TypedArrayKind::Float32Array>(runtime)
        .updateUnsafe(runtime, (float32_t*)buffer, size);
      break;
    case TFLTensorDataTypeFloat64:
      getTypedArray(runtime, boxedJSBuffer)
        .as<TypedArrayKind::Float64Array>(runtime)
        .updateUnsafe(runtime, (float64_t*)buffer, size);
      break;
      
    case TFLTensorDataTypeFloat16:
    case TFLTensorDataTypeBool:
    case TFLTensorDataTypeInt64:
    default:
      throw jsi::JSError(runtime, std::string("Unsupported output data type! ") + std::to_string(dataType));
  }
}

std::string dataTypeToString(TFLTensorDataType dataType) {
  switch (dataType) {
    case TFLTensorDataTypeFloat32:
      return "float32";
    case TFLTensorDataTypeFloat16:
      return "float16";
    case TFLTensorDataTypeInt32:
      return "int32";
    case TFLTensorDataTypeUInt8:
      return "uint8";
    case TFLTensorDataTypeInt64:
      return "int64";
    case TFLTensorDataTypeBool:
      return "bool";
    case TFLTensorDataTypeInt16:
      return "int16";
    case TFLTensorDataTypeInt8:
      return "int8";
    case TFLTensorDataTypeFloat64:
      return "float64";
    case TFLTensorDataTypeNoType:
    default:
      return "invalid";
  }
}

jsi::Object TensorHelpers::tensorToJSObject(jsi::Runtime &runtime, TFLTensor *tensor) {
  jsi::Object result(runtime);
  result.setProperty(runtime, "name", jsi::String::createFromUtf8(runtime, tensor.name.UTF8String));
  result.setProperty(runtime, "dataType", jsi::String::createFromUtf8(runtime, dataTypeToString(tensor.dataType)));
  
  NSError* error;
  NSArray<NSNumber*>* shape = [tensor shapeWithError:&error];
  if (error != nil) {
    throw jsi::JSError(runtime, std::string("Failed to get shape for tensor \"") + tensor.name.UTF8String + "\"! " + error.description.UTF8String);
  }
  jsi::Array shapeArray(runtime, shape.count);
  for (size_t i = 0; i < shape.count; i++) {
    shapeArray.setValueAtIndex(runtime, i, jsi::Value(shape[i].intValue));
  }
  result.setProperty(runtime, "shape", shapeArray);
  
  return result;
}

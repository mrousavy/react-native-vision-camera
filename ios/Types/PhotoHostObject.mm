//
//  PhotoHostObject.mm
//  VisionCamera
//
//  Created by Marc Rousavy on 04.01.22.
//  Copyright © 2022 mrousavy. All rights reserved.
//

#import "PhotoHostObject.h"
#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#import <jsi/jsi.h>

std::vector<jsi::PropNameID> PhotoHostObject::getPropertyNames(jsi::Runtime& rt) {
  std::vector<jsi::PropNameID> result;
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("toString")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("width")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("height")));
  return result;
}

jsi::Value PhotoHostObject::get(jsi::Runtime& runtime, const jsi::PropNameID& propName) {
  auto name = propName.utf8(runtime);

  if (name == "toString") {
    auto toString = [this] (jsi::Runtime& runtime, const jsi::Value&, const jsi::Value*, size_t) -> jsi::Value {
      auto width = [photo width];
      auto height = [photo height];

      NSMutableString* string = [NSMutableString stringWithFormat:@"%lu x %lu Photo", width, height];
      return jsi::String::createFromUtf8(runtime, string.UTF8String);
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "toString"), 0, toString);
  }

  if (name == "width") {
    this->assertIsFrameStrong(runtime, name);
    auto width = [photo width];
    return jsi::Value((double) width);
  }
  if (name == "height") {
    this->assertIsFrameStrong(runtime, name);
    auto height = [photo height];
    return jsi::Value((double) height);
  }

  return jsi::Value::undefined();
}

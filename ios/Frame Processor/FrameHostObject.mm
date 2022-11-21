//
//  FrameHostObject.m
//  VisionCamera
//
//  Created by Marc Rousavy on 22.03.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#import "FrameHostObject.h"
#import <Foundation/Foundation.h>
#import <jsi/jsi.h>

#import "SkCanvas.h"

std::vector<jsi::PropNameID> FrameHostObject::getPropertyNames(jsi::Runtime& rt) {
  std::vector<jsi::PropNameID> result;
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("toString")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("isValid")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("width")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("height")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("bytesPerRow")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("planesCount")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("close")));
  
  if (canvas != nullptr) {
    auto canvasPropNames = canvas->getPropertyNames(rt);
    for (auto& prop : canvasPropNames) {
      result.push_back(std::move(prop));
    }
  }
  
  return result;
}

SkRect inscribe(SkSize size, SkRect rect) {
  auto halfWidthDelta = (rect.width() - size.width()) / 2.0;
  auto halfHeightDelta = (rect.height() - size.height()) / 2.0;
  return SkRect::MakeXYWH(rect.x() + halfWidthDelta,
                          rect.y() + halfHeightDelta, size.width(),
                          size.height());
}

jsi::Value FrameHostObject::get(jsi::Runtime& runtime, const jsi::PropNameID& propName) {
  auto name = propName.utf8(runtime);

  if (name == "toString") {
    auto toString = [this] (jsi::Runtime& runtime, const jsi::Value&, const jsi::Value*, size_t) -> jsi::Value {
      if (this->frame == nil) {
        return jsi::String::createFromUtf8(runtime, "[closed frame]");
      }
      auto imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
      auto width = CVPixelBufferGetWidth(imageBuffer);
      auto height = CVPixelBufferGetHeight(imageBuffer);

      NSMutableString* string = [NSMutableString stringWithFormat:@"%lu x %lu Frame", width, height];
      return jsi::String::createFromUtf8(runtime, string.UTF8String);
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "toString"), 0, toString);
  }
  if (name == "close") {
    auto close = [this] (jsi::Runtime& runtime, const jsi::Value&, const jsi::Value*, size_t) -> jsi::Value {
      if (this->frame == nil) {
        throw jsi::JSError(runtime, "Trying to close an already closed frame! Did you call frame.close() twice?");
      }
      this->close();
      return jsi::Value::undefined();
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "close"), 0, close);
  }
  if (name == "render") {
    auto render = [this] (jsi::Runtime& runtime, const jsi::Value&, const jsi::Value* params, size_t size) -> jsi::Value {
      
      CVImageBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
      
      if (pixelBuffer == nil) {
        throw std::runtime_error("drawShader: Pixel Buffer is corrupt/empty.");
      }
      
      // assumes BGRA 8888
      auto srcBuff = CVPixelBufferGetBaseAddress(pixelBuffer);
      auto bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer);
      auto width = CVPixelBufferGetWidth(pixelBuffer);
      auto height = CVPixelBufferGetHeight(pixelBuffer);
      auto info = SkImageInfo::Make(width,
                                    height,
                                    kBGRA_8888_SkColorType,
                                    kOpaque_SkAlphaType);
      auto data = SkData::MakeWithoutCopy(srcBuff, bytesPerRow * height);
      auto image = SkImage::MakeRasterData(info, data, bytesPerRow);
      
      SkCanvas* canvas = this->canvas->getCanvas();
      
      auto surfaceWidth = canvas->getSurface()->width();
      auto surfaceHeight = canvas->getSurface()->height();
      
      auto sourceRect = SkRect::MakeXYWH(0, 0, width, height);
      auto destinationRect = SkRect::MakeXYWH(0,
                                              0,
                                              surfaceWidth,
                                              surfaceHeight);
      
      SkSize src;
      if (destinationRect.width() / destinationRect.height() > sourceRect.width() / sourceRect.height()) {
        src = SkSize::Make(sourceRect.width(), (sourceRect.width() * destinationRect.height()) / destinationRect.width());
      } else {
        src = SkSize::Make((sourceRect.height() * destinationRect.width()) / destinationRect.height(), sourceRect.height());
      }
      
      sourceRect = inscribe(src, sourceRect);
      destinationRect = inscribe(SkSize::Make(destinationRect.width(), destinationRect.height()), destinationRect);
      
      
      if (size > 0) {
        auto paintHostObject = params[0].asObject(runtime).asHostObject<RNSkia::JsiSkPaint>(runtime);
        auto paint = paintHostObject->getObject();
        canvas->drawImageRect(image,
                              sourceRect,
                              destinationRect,
                              SkSamplingOptions(),
                              paint.get(),
                              SkCanvas::kFast_SrcRectConstraint);
      } else {
        canvas->drawImageRect(image,
                              destinationRect,
                              SkSamplingOptions());
      }
      
      return jsi::Value::undefined();
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "render"), 1, render);
  }

  if (name == "isValid") {
    auto isValid = frame != nil && CMSampleBufferIsValid(frame.buffer);
    return jsi::Value(isValid);
  }
  if (name == "width") {
    this->assertIsFrameStrong(runtime, name);
    auto imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
    auto width = CVPixelBufferGetWidth(imageBuffer);
    return jsi::Value((double) width);
  }
  if (name == "height") {
    this->assertIsFrameStrong(runtime, name);
    auto imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
    auto height = CVPixelBufferGetHeight(imageBuffer);
    return jsi::Value((double) height);
  }
  if (name == "bytesPerRow") {
    this->assertIsFrameStrong(runtime, name);
    auto imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
    auto bytesPerRow = CVPixelBufferGetBytesPerRow(imageBuffer);
    return jsi::Value((double) bytesPerRow);
  }
  if (name == "planesCount") {
    this->assertIsFrameStrong(runtime, name);
    auto imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
    auto planesCount = CVPixelBufferGetPlaneCount(imageBuffer);
    return jsi::Value((double) planesCount);
  }

  if (canvas != nullptr) {
    // fallback to canvas function
    return canvas->get(runtime, std::move(propName));
  }
  
  return jsi::Value::undefined();
}

void FrameHostObject::assertIsFrameStrong(jsi::Runtime &runtime, const std::string &accessedPropName) {
  if (frame == nil) {
    auto message = "Cannot get `" + accessedPropName + "`, frame is already closed!";
    throw jsi::JSError(runtime, message.c_str());
  }
}

void FrameHostObject::close() {
  if (frame != nil) {
    CMSampleBufferInvalidate(frame.buffer);
    // ARC will hopefully delete it lol
    this->frame = nil;
  }
}

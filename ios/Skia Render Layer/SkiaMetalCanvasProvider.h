#pragma once

#ifndef __cplusplus
#error This header has to be compiled with C++!
#endif

#import <MetalKit/MetalKit.h>
#import <QuartzCore/CAMetalLayer.h>

#include <react_native_skia/react-native-skia-umbrella.h>

class SkiaMetalCanvasProvider {
public:
  SkiaMetalCanvasProvider(std::function<void()> requestRedraw);

  ~SkiaMetalCanvasProvider();

  float getScaledWidth();
  float getScaledHeight();

  void renderToCanvas(const std::function<void(SkCanvas *)> &cb);

  void setSize(int width, int height);

  CALayer *getLayer();

private:
  std::shared_ptr<RNSkia::RNSkPlatformContext> _context;
  float _width = -1;
  float _height = -1;
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability-new"
  CAMetalLayer *_layer;
#pragma clang diagnostic pop

  static id<MTLCommandQueue> _commandQueue;
  static id<MTLDevice> _device;
  static sk_sp<GrDirectContext> _skContext;
};

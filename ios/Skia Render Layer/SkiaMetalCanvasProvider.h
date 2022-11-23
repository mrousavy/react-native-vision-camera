#pragma once

#ifndef __cplusplus
#error This header has to be compiled with C++!
#endif

#import <MetalKit/MetalKit.h>
#import <QuartzCore/CAMetalLayer.h>

#import <AVFoundation/AVFoundation.h>

#include <functional>
#import <include/gpu/GrDirectContext.h>
#import "SkImage.h"
#import "SkImageHelpers.h"

class SkiaMetalCanvasProvider {
public:
  SkiaMetalCanvasProvider(std::function<void()> requestRedraw);

  ~SkiaMetalCanvasProvider();

  float getPixelDensity();
  float getScaledWidth();
  float getScaledHeight();

  void renderFrameToCanvas(CMSampleBufferRef sampleBuffer, const std::function<void(SkCanvas*)>& drawCallback);

  void setSize(int width, int height);

  CALayer* getLayer();

private:
  float _width = -1;
  float _height = -1;
  float _pixelDensity = 1;
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability-new"
  CAMetalLayer* _layer;
#pragma clang diagnostic pop
  CVMetalTextureCacheRef _textureCacheY;
  CVMetalTextureCacheRef _textureCacheCbCr;
  std::function<void()> _requestRedraw;

  static id<MTLCommandQueue> _commandQueue;
  static id<MTLDevice> _device;
  static sk_sp<GrDirectContext> _skContext;
  
  std::unique_ptr<SkImageHelpers> _imageHelper;
  
  id<CAMetalDrawable> _currentDrawable;
  void runLoop();
};


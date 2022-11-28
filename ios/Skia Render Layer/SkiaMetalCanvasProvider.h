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
#include <mutex>
#include <memory>

class SkiaMetalCanvasProvider: public std::enable_shared_from_this<SkiaMetalCanvasProvider> {
public:
  SkiaMetalCanvasProvider();
  ~SkiaMetalCanvasProvider();

  float getPixelDensity();
  float getScaledWidth();
  float getScaledHeight();

  void renderFrameToCanvas(CMSampleBufferRef sampleBuffer, const std::function<void(SkCanvas*)>& drawCallback);

  void setSize(int width, int height);

  CALayer* getLayer();
  
  std::unique_ptr<SkImageHelpers> _imageHelper;

private:
  float _width = -1;
  float _height = -1;
  float _pixelDensity = 1;
  
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability-new"
  CAMetalLayer* _layer;
#pragma clang diagnostic pop

  id<MTLCommandQueue> _commandQueue;
  id<MTLDevice> _device;
  sk_sp<GrDirectContext> _skContext;
  dispatch_queue_t _runLoopQueue;
  
  
  id<CAMetalDrawable> _currentDrawable;
  std::mutex _drawableMutex;
  
  bool _isValid;
  
private:
  void runLoop();
};


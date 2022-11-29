#pragma once

#ifndef __cplusplus
#error This header has to be compiled with C++!
#endif

#import <MetalKit/MetalKit.h>
#import <QuartzCore/CAMetalLayer.h>

#import <AVFoundation/AVFoundation.h>

#include <functional>
#include <include/gpu/GrDirectContext.h>
#include <mutex>
#include <memory>

#import "VisionDisplayLink.h"
#import "SkImageHelpers.h"

class SkiaMetalCanvasProvider: public std::enable_shared_from_this<SkiaMetalCanvasProvider> {
public:
  SkiaMetalCanvasProvider();
  ~SkiaMetalCanvasProvider();

  void renderFrameToCanvas(CMSampleBufferRef sampleBuffer, const std::function<void(SkCanvas*)>& drawCallback);
  
  void start();
  void setSize(int width, int height);
  CALayer* getLayer();
  
  std::shared_ptr<SkImageHelpers> imageHelpers;

private:
  float _width = -1;
  float _height = -1;
  
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability-new"
  CAMetalLayer* _layer;
#pragma clang diagnostic pop
  VisionDisplayLink* _displayLink;

  id<MTLCommandQueue> _commandQueue;
  id<MTLDevice> _device;
  sk_sp<GrDirectContext> _skContext;
  dispatch_queue_t _runLoopQueue;
  
  id<CAMetalDrawable> _currentDrawable;
  std::mutex _drawableMutex;
  
  bool _isValid;
  
private:
  void render();
  
  float getFrameTime();
  float getPixelDensity();
};


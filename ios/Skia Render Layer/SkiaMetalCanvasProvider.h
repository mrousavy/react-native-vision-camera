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
#include <atomic>

#import "VisionDisplayLink.h"

class SkiaMetalCanvasProvider: public std::enable_shared_from_this<SkiaMetalCanvasProvider> {
public:
  SkiaMetalCanvasProvider();
  ~SkiaMetalCanvasProvider();

  // Render a Camera Frame to the off-screen canvas
  void renderFrameToCanvas(CMSampleBufferRef sampleBuffer, const std::function<void(SkCanvas*)>& drawCallback);

  // Start updating the DisplayLink (runLoop @ screen refresh rate) and draw Frames to the Layer
  void start();
  // Update the size of the View (Layer)
  void setSize(int width, int height);
  CALayer* getLayer();

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
  id<MTLTexture> _texture;
  sk_sp<GrDirectContext> _skContext;

  std::mutex _textureMutex;

  bool _isValid = false;
  std::atomic<bool> _hasNewFrame = false;
  
private:
  void render();
  id<MTLTexture> getTexture(int width, int height);

  float getPixelDensity();
};


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
#import "SkiaMetalRenderContext.h"

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
  bool _isValid = false;
  float _width = -1;
  float _height = -1;
  
  // For rendering Camera Frame -> off-screen MTLTexture
  OffscreenRenderContext _offscreenContext;

  // For rendering off-screen MTLTexture -> on-screen CAMetalLayer
  LayerRenderContext _layerContext;
  
  // For synchronization between the two Threads/Contexts
  std::mutex _textureMutex;
  std::atomic<bool> _hasNewFrame = false;
  
private:
  void render();
  id<MTLTexture> getTexture(int width, int height);

  float getPixelDensity();
};


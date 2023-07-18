#pragma once

#ifndef __cplusplus
#error This header has to be compiled with C++!
#endif

#import <MetalKit/MetalKit.h>
#import <QuartzCore/CAMetalLayer.h>
#import <AVFoundation/AVFoundation.h>

#include <include/gpu/GrDirectContext.h>
#include <include/core/SkCanvas.h>

#include <functional>
#include <mutex>
#include <memory>
#include <atomic>

#import "VisionDisplayLink.h"
#import "SkiaMetalRenderContext.h"
#import "SkiaFrameProcessor.h"

class SkiaMetalCanvasProvider: public std::enable_shared_from_this<SkiaMetalCanvasProvider> {
public:
  SkiaMetalCanvasProvider();
  ~SkiaMetalCanvasProvider();

  // Start updating the DisplayLink (runLoop @ screen refresh rate) and draw Frames to the Layer
  void start();
  // Update the size of the View (Layer)
  void setSize(int width, int height);
  CALayer* getLayer();
  
  void setSkiaFrameProcessor(SkiaFrameProcessor* skiaFrameProcessor);

private:
  bool _isValid = false;
  float _width = -1;
  float _height = -1;

  // For rendering off-screen MTLTexture -> on-screen CAMetalLayer
  LayerRenderContext _layerContext;
  
  // Frame Processor holds latest frames
  SkiaFrameProcessor* _frameProcessor;
  
private:
  void render();
  id<MTLTexture> getTexture(int width, int height);

  float getPixelDensity();
};


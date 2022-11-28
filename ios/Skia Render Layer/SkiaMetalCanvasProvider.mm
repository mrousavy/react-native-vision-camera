#import "SkiaMetalCanvasProvider.h"

#import <AVFoundation/AVFoundation.h>
#import <Metal/Metal.h>

#import <include/core/SkColorSpace.h>
#import <include/core/SkSurface.h>
#import <include/core/SkCanvas.h>
#import <include/gpu/GrDirectContext.h>

#import "SkImageHelpers.h"

SkiaMetalCanvasProvider::SkiaMetalCanvasProvider(): std::enable_shared_from_this<SkiaMetalCanvasProvider>() {
  _device = MTLCreateSystemDefaultDevice();
  _commandQueue = id<MTLCommandQueue>(CFRetain((GrMTLHandle)[_device newCommandQueue]));
  _runLoopQueue = dispatch_queue_create("Camera Preview runLoop", DISPATCH_QUEUE_SERIAL);

  #pragma clang diagnostic push
  #pragma clang diagnostic ignored "-Wunguarded-availability-new"
  _layer = [CAMetalLayer layer];
  #pragma clang diagnostic pop

  _layer.framebufferOnly = NO;
  _layer.device = _device;
  _layer.opaque = false;
  _layer.contentsScale = getPixelDensity();
  // TODO: sRGB? Or nah?
  _layer.pixelFormat = MTLPixelFormatBGRA8Unorm;
  
  _isValid = true;
  
  _displayLink = [[VisionDisplayLink alloc] init];
}

SkiaMetalCanvasProvider::~SkiaMetalCanvasProvider() {
  _isValid = false;
  [_displayLink stop];
}

void SkiaMetalCanvasProvider::start() {
  [_displayLink start:[weakThis = weak_from_this()](double time) {
    auto thiz = weakThis.lock();
    if (thiz) {
      
      thiz->render();
    }
  }];
}

void SkiaMetalCanvasProvider::render() {
  @autoreleasepool {
    // Blocks until the next Frame is ready (16ms at 60 FPS)
    auto tempDrawable = [_layer nextDrawable];
    
    // After we got a new Drawable (from blocking call), make sure we're still valid
    if (!_isValid) return;
    
#if DEBUG
    auto start = CFAbsoluteTimeGetCurrent();
#endif
    std::unique_lock lock(_drawableMutex);
    _currentDrawable = tempDrawable;
    lock.unlock();
#if DEBUG
    auto end = CFAbsoluteTimeGetCurrent();
    auto lockTime = (end - start) * 1000;
    auto diffTime = lockTime - getFrameTime();
    if (diffTime > 1) {
      NSLog(@"The previous draw call took so long that it blocked a new Frame from coming in for %f ms!", diffTime);
    }
#endif
  }
}

float SkiaMetalCanvasProvider::getPixelDensity() {
  return UIScreen.mainScreen.scale;
}

float SkiaMetalCanvasProvider::getFrameTime() {
  return 1000.0f / UIScreen.mainScreen.maximumFramesPerSecond;
}

/**
 Render to a canvas
 */
void SkiaMetalCanvasProvider::renderFrameToCanvas(CMSampleBufferRef sampleBuffer, const std::function<void(SkCanvas*)>& drawCallback) {
  auto start = CFAbsoluteTimeGetCurrent();
  
  if(_width == -1 && _height == -1) {
    return;
  }

  if(_skContext == nullptr) {
    GrContextOptions grContextOptions;
    _skContext = GrDirectContext::MakeMetal((__bridge void*)_device,
                                            (__bridge void*)_commandQueue,
                                            grContextOptions);
  }

  // Wrap in auto release pool since we want the system to clean up after rendering
  // and not wait until later - we've seen some example of memory usage growing very
  // fast in the simulator without this.
  @autoreleasepool {
    // Lock Mutex to block the runLoop from overwriting the _currentDrawable
    std::lock_guard lockGuard(_drawableMutex);
    
    // Get the drawable to keep the reference/retain ownership here.
    id<CAMetalDrawable> currentDrawable = _currentDrawable;
    
    // No Drawable is ready. Abort
    if (currentDrawable == nullptr) {
      return;
    }
    
    // Get & Lock the writeable Texture from the Metal Drawable
    GrMtlTextureInfo fbInfo;
    fbInfo.fTexture.retain((__bridge void*)currentDrawable.texture);
    GrBackendRenderTarget backendRT(_layer.drawableSize.width,
                                    _layer.drawableSize.height,
                                    1,
                                    fbInfo);
    
    // Create a Skia Surface from the writable Texture
    auto skSurface = SkSurface::MakeFromBackendRenderTarget(_skContext.get(),
                                                            backendRT,
                                                            kTopLeft_GrSurfaceOrigin,
                                                            kBGRA_8888_SkColorType,
                                                            nullptr,
                                                            nullptr);
    
    if(skSurface == nullptr || skSurface->getCanvas() == nullptr) {
      throw std::runtime_error("Skia surface could not be created from parameters.");
    }
    
    // Get the Frame's PixelBuffer
    CVImageBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer);
    
    if (pixelBuffer == nil) {
      throw std::runtime_error("drawFrame: Pixel Buffer is corrupt/empty.");
    }
    
    // Lock the Frame's PixelBuffer for the duration of the Frame Processor so the user can safely do operations on it
    CVPixelBufferLockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);
    
#if DEBUG
    auto startConvert = CFAbsoluteTimeGetCurrent();
#endif
    // Converts the CMSampleBuffer to an SkImage - RGB.
    auto image = SkImageHelpers::convertCMSampleBufferToSkImage(sampleBuffer);
#if DEBUG
    auto endConvert = CFAbsoluteTimeGetCurrent();
    NSLog(@"CMSampleBuffer -> SkImage conversion took %f ms", (endConvert - startConvert) * 1000);
#endif
    
    auto canvas = skSurface->getCanvas();
    auto surface = canvas->getSurface();
    
    // Calculate Center Crop (aspectRatio: cover) transform
    auto sourceRect = SkRect::MakeXYWH(0, 0, image->width(), image->height());
    auto destinationRect = SkRect::MakeXYWH(0, 0, surface->width(), surface->height());
    sourceRect = SkImageHelpers::createCenterCropRect(sourceRect, destinationRect);
    
    auto offsetX = -sourceRect.left();
    auto offsetY = -sourceRect.top();

    
    // The Canvas is equal to the View size, where-as the Frame has a different size (e.g. 4k)
    // We scale the Canvas to the exact dimensions of the Frame so that the user can use the Frame as a coordinate system
    canvas->save();
    
    auto scaleW = static_cast<double>(surface->width()) / (image->width());
    auto scaleH = static_cast<double>(surface->height()) / (image->height());
    auto scale = MAX(scaleW, scaleH);
    canvas->scale(scale, scale);
    canvas->translate(offsetX, offsetY);
    
    // Draw the Image into the Frame (aspectRatio: cover)
    // The Frame Processor might draw the Frame again (through render()) to pass a custom paint/shader,
    // but that'll just overwrite the existing one - no need to worry.
    canvas->drawImage(image, 0, 0);
    
#if DEBUG
    auto startJS = CFAbsoluteTimeGetCurrent();
#endif
    drawCallback(canvas);
#if DEBUG
    auto endJS = CFAbsoluteTimeGetCurrent();
    NSLog(@"Frame Processor call took %f ms", (endJS - startJS) * 1000);
#endif
    
    // Restore the scale & transform
    canvas->restore();
    
    // Flush all appended operations on the canvas and commit it to the SkSurface
    canvas->flush();
    
    // Pass the drawable into the Metal Command Buffer and submit it to the GPU
    id<MTLCommandBuffer> commandBuffer([_commandQueue commandBuffer]);
    [commandBuffer presentDrawable:currentDrawable];
    [commandBuffer commit];
    
    // Unlock the Pixel Buffer again so it can be freed up
    CVPixelBufferUnlockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);
  }
  
  auto end = CFAbsoluteTimeGetCurrent();
  NSLog(@"Draw took %f ms", (end - start) * 1000);
};

void SkiaMetalCanvasProvider::setSize(int width, int height) {
  _width = width;
  _height = height;
  _layer.frame = CGRectMake(0, 0, width, height);
  _layer.drawableSize = CGSizeMake(width * getPixelDensity(),
                                   height* getPixelDensity());
}

CALayer* SkiaMetalCanvasProvider::getLayer() { return _layer; }

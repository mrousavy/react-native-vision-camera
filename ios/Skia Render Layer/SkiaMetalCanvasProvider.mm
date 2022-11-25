#import "SkiaMetalCanvasProvider.h"

#import <AVFoundation/AVFoundation.h>
#import <Metal/Metal.h>

#import <include/core/SkColorSpace.h>
#import <include/core/SkSurface.h>
#import <include/core/SkCanvas.h>
#import <include/gpu/GrDirectContext.h>
#import <include/gpu/GrYUVABackendTextures.h>

#import "SkImageHelpers.h"

// These static class members are used by all Skia Views
id<MTLDevice> SkiaMetalCanvasProvider::_device = nullptr;
id<MTLCommandQueue> SkiaMetalCanvasProvider::_commandQueue = nullptr;
sk_sp<GrDirectContext> SkiaMetalCanvasProvider::_skContext = nullptr;

SkiaMetalCanvasProvider::SkiaMetalCanvasProvider(std::function<void()> requestRedraw): _requestRedraw(requestRedraw) {
  if (!_device) {
    _device = MTLCreateSystemDefaultDevice();
  }
  if (!_commandQueue) {
    _commandQueue = id<MTLCommandQueue>(CFRetain((GrMTLHandle)[_device newCommandQueue]));
  }

  #pragma clang diagnostic push
  #pragma clang diagnostic ignored "-Wunguarded-availability-new"
  _layer = [CAMetalLayer layer];
  #pragma clang diagnostic pop

  _layer.framebufferOnly = NO;
  _layer.device = _device;
  _layer.opaque = false;
  _layer.contentsScale = getPixelDensity();
  _layer.pixelFormat = MTLPixelFormatBGRA8Unorm;
  
  auto queue = dispatch_queue_create("Camera Preview runLoop()", DISPATCH_QUEUE_SERIAL);
  dispatch_async(queue, ^{
    runLoop();
  });
}

SkiaMetalCanvasProvider::~SkiaMetalCanvasProvider() {
  if([[NSThread currentThread] isMainThread]) {
    _layer = NULL;
  } else {
    __block auto tempLayer = _layer;
    dispatch_async(dispatch_get_main_queue(), ^{
      // By using the tempLayer variable in the block we capture it and it will be
      // released after the block has finished. This way the CAMetalLayer dealloc will
      // only be called on the main thread. Problem: this destructor might be called from
      // releasing the RNSkDrawViewImpl from a thread capture (after dtor has started),
      // which would cause the CAMetalLayer dealloc to be called on another thread which
      // causes a crash.
      // https://github.com/Shopify/react-native-skia/issues/398
      tempLayer = tempLayer;
    });
  }
}

void SkiaMetalCanvasProvider::runLoop() {
  while (_layer != nil) {
    @autoreleasepool {
      auto tempDrawable = [_layer nextDrawable];
#if DEBUG
      auto start = CFAbsoluteTimeGetCurrent();
#endif
      this->drawableMutex.lock();
      _currentDrawable = tempDrawable;
      this->drawableMutex.unlock();
#if DEBUG
      auto end = CFAbsoluteTimeGetCurrent();
      auto lockTime = (end - start) * 1000;
      if (lockTime > 1) {
        NSLog(@"The previous draw call took so long that it blocked a new Frame from coming in for %f ms!", lockTime);
      }
#endif
    }
  }
}

float SkiaMetalCanvasProvider::getPixelDensity() { return _pixelDensity; }

/**
 Returns the scaled width of the view
 */
float SkiaMetalCanvasProvider::getScaledWidth() { return _width * getPixelDensity(); };

/**
 Returns the scaled height of the view
 */
float SkiaMetalCanvasProvider::getScaledHeight() { return _height * getPixelDensity(); };


SkRect inscribe(SkSize size, SkRect rect) {
  auto halfWidthDelta = (rect.width() - size.width()) / 2.0;
  auto halfHeightDelta = (rect.height() - size.height()) / 2.0;
  return SkRect::MakeXYWH(rect.x() + halfWidthDelta,
                          rect.y() + halfHeightDelta,
                          size.width(),
                          size.height());
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
  if (_imageHelper == nil) {
    _imageHelper = std::make_unique<SkImageHelpers>(_device, _skContext);
  }

  // Wrap in auto release pool since we want the system to clean up after rendering
  // and not wait until later - we've seen some example of memory usage growing very
  // fast in the simulator without this.
  @autoreleasepool {
    auto startPrepare = CFAbsoluteTimeGetCurrent();
    this->drawableMutex.lock();
    id<CAMetalDrawable> currentDrawable = _currentDrawable;
    
    if (currentDrawable == nullptr) {
      return;
    }
    
    auto endPrepare = CFAbsoluteTimeGetCurrent();
    NSLog(@"Prepare took %f ms", (endPrepare - startPrepare) * 1000);
    
    GrMtlTextureInfo fbInfo;
    fbInfo.fTexture.retain((__bridge void*)currentDrawable.texture);
    
    GrBackendRenderTarget backendRT(_layer.drawableSize.width,
                                    _layer.drawableSize.height,
                                    1,
                                    fbInfo);
    
    
    auto skSurface = SkSurface::MakeFromBackendRenderTarget(_skContext.get(),
                                                            backendRT,
                                                            kTopLeft_GrSurfaceOrigin,
                                                            kBGRA_8888_SkColorType,
                                                            nullptr,
                                                            nullptr);
    
    if(skSurface == nullptr || skSurface->getCanvas() == nullptr) {
      throw std::runtime_error("Skia surface could not be created from parameters.");
    }
    
    auto format = CMSampleBufferGetFormatDescription(sampleBuffer);
    NSLog(@"%lu : %@ : %u : %u", CMFormatDescriptionGetTypeID(), CMFormatDescriptionGetExtensions(format), (unsigned int)CMFormatDescriptionGetMediaType(format), (unsigned int)CMFormatDescriptionGetMediaSubType(format));
    
    CVImageBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer);
    
    if (pixelBuffer == nil) {
      throw std::runtime_error("drawFrame: Pixel Buffer is corrupt/empty.");
    }
    
    CVPixelBufferLockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);
    
    auto image = _imageHelper->convertCMSampleBufferToSkImage(sampleBuffer);
    
    auto canvas = skSurface->getCanvas();
    
    
    auto surfaceWidth = canvas->getSurface()->width();
    auto surfaceHeight = canvas->getSurface()->height();
    
    auto sourceRect = SkRect::MakeXYWH(0, 0, image->width(), image->height());
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
    
    
    canvas->drawImageRect(image,
                          sourceRect,
                          destinationRect,
                          SkSamplingOptions(),
                          nullptr,
                          SkCanvas::kFast_SrcRectConstraint);
    
    auto startJS = CFAbsoluteTimeGetCurrent();
    drawCallback(canvas);
    auto endJS = CFAbsoluteTimeGetCurrent();
    NSLog(@"Frame Processor call took %f ms", (endJS - startJS) * 1000);
    
    canvas->flush();
    
    id<MTLCommandBuffer> commandBuffer([_commandQueue commandBuffer]);
    [commandBuffer presentDrawable:currentDrawable];
    [commandBuffer commit];
    
    CVPixelBufferUnlockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);
    this->drawableMutex.unlock();
  }
  
  auto end = CFAbsoluteTimeGetCurrent();
  NSLog(@"Draw took %f ms", (end - start) * 1000);
};

void SkiaMetalCanvasProvider::setSize(int width, int height) {
  _width = width;
  _height = height;
  _pixelDensity = [[UIScreen mainScreen] scale];
  _layer.frame = CGRectMake(0, 0, width, height);
  _layer.drawableSize = CGSizeMake(width * getPixelDensity(),
                                   height* getPixelDensity());

  _requestRedraw();
}

CALayer* SkiaMetalCanvasProvider::getLayer() { return _layer; }

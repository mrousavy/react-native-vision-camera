#import "SkiaMetalCanvasProvider.h"

#import <AVFoundation/AVFoundation.h>
#import <Metal/Metal.h>

#import <include/core/SkColorSpace.h>
#import <include/core/SkSurface.h>
#import <include/core/SkCanvas.h>
#import <include/gpu/GrDirectContext.h>
#import <include/gpu/GrYUVABackendTextures.h>

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
  
  if (CVMetalTextureCacheCreate(kCFAllocatorDefault, nil, _device, nil, &_textureCache) != kCVReturnSuccess) {
    throw std::runtime_error("Failed to create Metal Texture Cache!");
  }
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

float SkiaMetalCanvasProvider::getPixelDensity() { return [[UIScreen mainScreen] scale]; }

/**
 Returns the scaled width of the view
 */
float SkiaMetalCanvasProvider::getScaledWidth() { return _width * getPixelDensity(); };

/**
 Returns the scaled height of the view
 */
float SkiaMetalCanvasProvider::getScaledHeight() { return _height * getPixelDensity(); };

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
    id<CAMetalDrawable> currentDrawable = [_layer nextDrawable];
    if(currentDrawable == nullptr) {
      return;
    }
    
    GrMtlTextureInfo fbInfo;
    fbInfo.fTexture.retain((__bridge void*)currentDrawable.texture);
    
    
    
    GrBackendRenderTarget backendRT(_layer.drawableSize.width,
                                    _layer.drawableSize.height,
                                    1,
                                    fbInfo);
    
    // TODO: Create a Texture Cache instead of re-creating everything all the time.
    /*
    CVMetalTextureRef cvTexture;
    CVMetalTextureCacheCreateTextureFromImage(kCFAllocatorDefault,
                                              _textureCache,
                                              pixelBuffer,
                                              nil,
                                              // TODO: Our source CMSampleBuffer is in 420v/420f, not RGBA!
                                              MTLPixelFormatBGRA8Unorm,
                                              _width,
                                              _height,
                                              0,
                                              &cvTexture);
    
    GrMtlTextureInfo textureInfo;
    auto t = CVMetalTextureGetTexture(cvTexture);
  
    textureInfo.fTexture.retain((__bridge void*)t);
    */
    
    
    auto skSurface = SkSurface::MakeFromBackendRenderTarget(_skContext.get(),
                                                            backendRT,
                                                            kTopLeft_GrSurfaceOrigin,
                                                            kBGRA_8888_SkColorType,
                                                            nullptr,
                                                            nullptr);
    
    if(skSurface == nullptr || skSurface->getCanvas() == nullptr) {
      throw std::runtime_error("Skia surface could not be created from parameters.");
    }
    
    skSurface->getCanvas()->clear(SK_AlphaTRANSPARENT);
    
    CVImageBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer);
    
    if (pixelBuffer == nil) {
      throw std::runtime_error("drawFrame: Pixel Buffer is corrupt/empty.");
    }
    
    CVPixelBufferLockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);
    
    // assumes BGRA 8888
    auto srcBuff = CVPixelBufferGetBaseAddress(pixelBuffer);
    auto bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer);
    auto height = CVPixelBufferGetHeight(pixelBuffer);
    auto info = SkImageInfo::Make(CVPixelBufferGetWidth(pixelBuffer),
                                  CVPixelBufferGetHeight(pixelBuffer),
                                  kBGRA_8888_SkColorType,
                                  kOpaque_SkAlphaType);
    // TODO: Skip this copy. This is too slow, we only want to copy once (from CMSampleBuffer straight into the Skia Canvas)
    auto data = SkData::MakeWithCopy(srcBuff, bytesPerRow * height);
    auto image = SkImage::MakeRasterData(info, data, bytesPerRow);
    
    // TODO: Right now we convert the image buffer from it's source format (whether that's YUV 420v, 420f, x420, or something else) to BGRA8888 (RGB). This conversion is slow and adds a ton of overhead - so we want to find a way to use the source format (YUV) directly instead. This also needs to be changed in CameraView+AVCaptureSession.
    /*
     // assumes YUV 420v
     GrBackendTexture textures[1];
     textures[0] = GrBackendTexture(_width,
     _height,
     GrMipmapped::kNo,
     textureInfo);
     
     // TODO: I have no idea if that's correct.
     SkYUVAInfo yuvInfo(SkISize::Make(_width, _height),
     SkYUVAInfo::PlaneConfig::kYUV,
     SkYUVAInfo::Subsampling::k420,
     SkYUVColorSpace::kJPEG_Full_SkYUVColorSpace);
     GrYUVABackendTextures te(yuvInfo,
     textures,
     kTopLeft_GrSurfaceOrigin);
     
     auto image = SkImage::MakeFromYUVATextures(_skContext.get(), te);
     */
    
    auto canvas = skSurface->getCanvas();
    canvas->drawImage(image,
                                      0,
                                      0
                                      // TODO: Paint???
                                      );
    // TODO: Run Frame Processor with all drawing operations on the Canvas now
      
    drawCallback(canvas);
    
    canvas->flush();
    
    id<MTLCommandBuffer> commandBuffer([_commandQueue commandBuffer]);
    [commandBuffer presentDrawable:currentDrawable];
    [commandBuffer commit];
    
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

  _requestRedraw();
}

CALayer* SkiaMetalCanvasProvider::getLayer() { return _layer; }

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

float SkiaMetalCanvasProvider::getPixelDensity() { return _pixelDensity; }

/**
 Returns the scaled width of the view
 */
float SkiaMetalCanvasProvider::getScaledWidth() { return _width * getPixelDensity(); };

/**
 Returns the scaled height of the view
 */
float SkiaMetalCanvasProvider::getScaledHeight() { return _height * getPixelDensity(); };

sk_sp<SkImage> SkiaMetalCanvasProvider::convertCVPixelBufferToSkImage(CVPixelBufferRef pixelBuffer) {
  // We assume that the CVPixelBuffer is in YCbCr format, so we have to create 2 textures:
  //  - for Y
  //  - for CbCr
  CVMetalTextureRef cvTextureY;
  CVMetalTextureCacheCreateTextureFromImage(kCFAllocatorDefault,
                                            _textureCache,
                                            pixelBuffer,
                                            nil,
                                            MTLPixelFormatR8Unorm,
                                            _width,
                                            _height,
                                            0, // plane index 0: Y
                                            &cvTextureY);
  GrMtlTextureInfo textureInfoY;
  auto mtlTextureY = CVMetalTextureGetTexture(cvTextureY);
  textureInfoY.fTexture.retain((__bridge void*)mtlTextureY);
  
  
  CVMetalTextureRef cvTextureCbCr;
  CVMetalTextureCacheCreateTextureFromImage(kCFAllocatorDefault,
                                            _textureCache,
                                            pixelBuffer,
                                            nil,
                                            MTLPixelFormatRG8Unorm,
                                            _width,
                                            _height,
                                            1, // plane index 1: CbCr
                                            &cvTextureCbCr);
  GrMtlTextureInfo textureInfoCbCr;
  auto mtlTextureCbCr = CVMetalTextureGetTexture(cvTextureCbCr);
  textureInfoCbCr.fTexture.retain((__bridge void*)mtlTextureCbCr);

  // Combine textures into array
  GrBackendTexture textures[] {
    GrBackendTexture(_width,
                     _height,
                     GrMipmapped::kNo,
                     textureInfoY),
    GrBackendTexture(_width,
                     _height,
                     GrMipmapped::kNo,
                     textureInfoCbCr)
  };
   
  // Create YUV map interpretation
  //  - k420 because we are assuming 420v
  //  - Y_UV because we have one Y texture, one UV (CbCr) texture
  //  - Limited YUV Color Space because we are assuming 420v (video). 420f would be Full
  SkYUVAInfo yuvInfo(SkISize::Make(_width, _height),
                     SkYUVAInfo::PlaneConfig::kY_UV,
                     SkYUVAInfo::Subsampling::k420,
                     SkYUVColorSpace::kRec709_Limited_SkYUVColorSpace);
  GrYUVABackendTextures yuvaTextures(yuvInfo,
                                     textures,
                                     kTopLeft_GrSurfaceOrigin);
  
  auto image = SkImage::MakeFromYUVATextures(_skContext.get(), yuvaTextures);
  return image;
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
    auto startPrepare = CFAbsoluteTimeGetCurrent();
    id<CAMetalDrawable> currentDrawable = [_layer nextDrawable];
    if(currentDrawable == nullptr) {
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
    
    
    auto canvas = skSurface->getCanvas();
    
    auto startJS = CFAbsoluteTimeGetCurrent();
    drawCallback(canvas);
    auto endJS = CFAbsoluteTimeGetCurrent();
    NSLog(@"Frame Processor call took %f ms", (endJS - startJS) * 1000);
    
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
  _pixelDensity = [[UIScreen mainScreen] scale];
  _layer.frame = CGRectMake(0, 0, width, height);
  _layer.drawableSize = CGSizeMake(width * getPixelDensity(),
                                   height* getPixelDensity());

  _requestRedraw();
}

CALayer* SkiaMetalCanvasProvider::getLayer() { return _layer; }

#import "SkiaMetalCanvasProvider.h"

#import <AVFoundation/AVFoundation.h>
#import <Metal/Metal.h>

#import <include/core/SkColorSpace.h>
#import <include/core/SkSurface.h>
#import <include/core/SkCanvas.h>
#import <include/core/SkFont.h>
#import <include/gpu/GrDirectContext.h>

#import "SkImageHelpers.h"

#include <memory>

// 1 = show FPS counter in Skia Preview, 0 = don't
#define DEBUG_FPS 1

SkiaMetalCanvasProvider::SkiaMetalCanvasProvider(): std::enable_shared_from_this<SkiaMetalCanvasProvider>() {
  _device = MTLCreateSystemDefaultDevice();
  _commandQueue = id<MTLCommandQueue>(CFRetain((GrMTLHandle)[_device newCommandQueue]));
  _skContext = GrDirectContext::MakeMetal((__bridge void*)_device,
                                          (__bridge void*)_commandQueue);

  #pragma clang diagnostic push
  #pragma clang diagnostic ignored "-Wunguarded-availability-new"
  _layer = [CAMetalLayer layer];
  #pragma clang diagnostic pop

  _layer.framebufferOnly = NO;
  _layer.device = _device;
  _layer.opaque = false;
  _layer.contentsScale = getPixelDensity();
  _layer.pixelFormat = MTLPixelFormatBGRA8Unorm;
  
  _isValid = true;
  
  _displayLink = [[VisionDisplayLink alloc] init];
}

SkiaMetalCanvasProvider::~SkiaMetalCanvasProvider() {
  _isValid = false;
  NSLog(@"VisionCamera: Stopping SkiaMetalCanvasProvider DisplayLink...");
  [_displayLink stop];
}

void SkiaMetalCanvasProvider::start() {
  NSLog(@"VisionCamera: Starting SkiaMetalCanvasProvider DisplayLink...");
  [_displayLink start:[weakThis = weak_from_this()](double time) {
    auto thiz = weakThis.lock();
    if (thiz) {
      thiz->render();
    }
  }];
}

id<MTLTexture> SkiaMetalCanvasProvider::getTexture(int width, int height) {
  if (_texture == nil || _texture.width != width || _texture.height != height) {
    // Create new texture with the given width and height
    MTLTextureDescriptor* textureDescriptor = [MTLTextureDescriptor texture2DDescriptorWithPixelFormat:MTLPixelFormatBGRA8Unorm
                                                                                                 width:width
                                                                                                height:height
                                                                                             mipmapped:NO];
    textureDescriptor.usage = MTLTextureUsageRenderTarget | MTLTextureUsageShaderRead;
    _texture = [_device newTextureWithDescriptor:textureDescriptor];
  }
  return _texture;
}

/**
 Callback from the DisplayLink - renders the current in-memory off-screen texture to the on-screen CAMetalLayer
 */
void SkiaMetalCanvasProvider::render() {
  if (_width == -1 && _height == -1) {
    return;
  }
  
  @autoreleasepool {
    // Lock the Mutex so we can operate on the Texture atomically without
    // renderFrameToCanvas() overwriting in between from a different thread
    std::unique_lock lock(_textureMutex);
    
    // Create a Skia Surface from the CAMetalLayer (use to draw to the View)
    GrMTLHandle drawableHandle;
    auto surface = SkSurface::MakeFromCAMetalLayer(_skContext.get(),
                                                   (__bridge GrMTLHandle)_layer,
                                                   kTopLeft_GrSurfaceOrigin,
                                                   1,
                                                   kBGRA_8888_SkColorType,
                                                   nullptr,
                                                   nullptr,
                                                   &drawableHandle);
    if (surface == nullptr || surface->getCanvas() == nullptr) {
      throw std::runtime_error("Skia surface could not be created from parameters.");
    }
    
    auto canvas = surface->getCanvas();
    
    // Get the texture
    auto texture = _texture;
    if (texture == nil) return;
    
    // Calculate Center Crop (aspectRatio: cover) transform
    auto sourceRect = SkRect::MakeXYWH(0, 0, texture.width, texture.height);
    auto destinationRect = SkRect::MakeXYWH(0, 0, surface->width(), surface->height());
    sourceRect = SkImageHelpers::createCenterCropRect(sourceRect, destinationRect);
    auto offsetX = -sourceRect.left();
    auto offsetY = -sourceRect.top();

    // The Canvas is equal to the View size, where-as the Frame has a different size (e.g. 4k)
    // We scale the Canvas to the exact dimensions of the Frame so that the user can use the Frame as a coordinate system
    canvas->save();
    
    auto scaleW = static_cast<double>(surface->width()) / texture.width;
    auto scaleH = static_cast<double>(surface->height()) / texture.height;
    auto scale = MAX(scaleW, scaleH);
    canvas->scale(scale, scale);
    canvas->translate(offsetX, offsetY);
    
    // Convert the rendered MTLTexture to an SkImage
    GrMtlTextureInfo textureInfo;
    textureInfo.fTexture.retain((__bridge void*)texture);
    GrBackendTexture backendTexture(texture.width, texture.height, GrMipmapped::kNo, textureInfo);
    auto image = SkImage::MakeFromTexture(_skContext.get(),
                                          backendTexture,
                                          kTopLeft_GrSurfaceOrigin,
                                          kBGRA_8888_SkColorType,
                                          kOpaque_SkAlphaType,
                                          SkColorSpace::MakeSRGB());
    
    // Draw the Texture (Frame) to the Canvas
    canvas->drawImage(image, 0, 0);
    
    // Restore the scale & transform
    canvas->restore();
    
#if DEBUG
#if DEBUG_FPS
    // Draw FPS on screen
    int fps = static_cast<int>(round(_displayLink.currentFps));
    int targetFps = static_cast<int>(round(_displayLink.targetFps));
    SkString string("FPS: " + std::to_string(fps) + " / " + std::to_string(targetFps));
    auto typeface = SkTypeface::MakeFromName("Arial", SkFontStyle::Bold());
    SkFont font(typeface, 32);
    SkPaint paint;
    paint.setColor(SkColors::kRed);
    canvas->drawString(string, 50, 200, font, paint);
#endif
#endif
    
    surface->flushAndSubmit();
    
    // Pass the drawable into the Metal Command Buffer and submit it to the GPU
    id<CAMetalDrawable> drawable = (__bridge id<CAMetalDrawable>)drawableHandle;
    id<MTLCommandBuffer> commandBuffer([_commandQueue commandBuffer]);
    [commandBuffer presentDrawable:drawable];
    [commandBuffer commit];
    
    lock.unlock();
  }
}

float SkiaMetalCanvasProvider::getPixelDensity() {
  return UIScreen.mainScreen.scale;
}

/**
 Render to a canvas. This uses the current in-memory off-screen texture and draws to it.
 The buffer is expected to be in RGB (`BGRA_8888`) format.
 While rendering, `drawCallback` will be invoked with a Skia Canvas instance which can be used for Frame Processing (JS).
 */
void SkiaMetalCanvasProvider::renderFrameToCanvas(CMSampleBufferRef sampleBuffer, const std::function<void(SkCanvas*)>& drawCallback) {
  if (_width == -1 && _height == -1) {
    return;
  }

  // Wrap in auto release pool since we want the system to clean up after rendering
  // and not wait until later - we've seen some example of memory usage growing very
  // fast in the simulator without this.
  @autoreleasepool {
    // Get the Frame's PixelBuffer
    CVImageBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer);
    if (pixelBuffer == nil) {
      throw std::runtime_error("drawFrame: Pixel Buffer is corrupt/empty.");
    }
    
    // Lock Mutex to block the runLoop from overwriting the _currentDrawable
    std::unique_lock lock(_textureMutex);
    
    // Get the Metal Texture we use for in-memory drawing
    auto texture = getTexture(CVPixelBufferGetWidth(pixelBuffer),
                              CVPixelBufferGetHeight(pixelBuffer));
    
    // Get & Lock the writeable Texture from the Metal Drawable
    GrMtlTextureInfo fbInfo;
    fbInfo.fTexture.retain((__bridge void*)texture);
    GrBackendRenderTarget backendRT(texture.width,
                                    texture.height,
                                    1,
                                    fbInfo);
    
    // Create a Skia Surface from the writable Texture
    auto surface = SkSurface::MakeFromBackendRenderTarget(_skContext.get(),
                                                          backendRT,
                                                          kTopLeft_GrSurfaceOrigin,
                                                          kBGRA_8888_SkColorType,
                                                          nullptr,
                                                          nullptr);
    
    if (surface == nullptr || surface->getCanvas() == nullptr) {
      throw std::runtime_error("Skia surface could not be created from parameters.");
    }
    
    // Lock the Frame's PixelBuffer for the duration of the Frame Processor so the user can safely do operations on it
    CVPixelBufferLockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);
    
    // Converts the CMSampleBuffer to an SkImage - RGB.
    auto image = SkImageHelpers::convertCMSampleBufferToSkImage(_skContext.get(), sampleBuffer);
    
    auto canvas = surface->getCanvas();
    
    // Clear everything so we keep it at a clean state
    canvas->clear(SkColors::kBlack);
    
    // Draw the Image into the Frame (aspectRatio: cover)
    // The Frame Processor might draw the Frame again (through render()) to pass a custom paint/shader,
    // but that'll just overwrite the existing one - no need to worry.
    canvas->drawImage(image, 0, 0);
    
    // Call the JS Frame Processor.
    drawCallback(canvas);
    
    // Flush all appended operations on the canvas and commit it to the SkSurface
    surface->flushAndSubmit();
    
    lock.unlock();
    CVPixelBufferUnlockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);
  }
}

void SkiaMetalCanvasProvider::setSize(int width, int height) {
  _width = width;
  _height = height;
  _layer.frame = CGRectMake(0, 0, width, height);
  _layer.drawableSize = CGSizeMake(width * getPixelDensity(),
                                   height* getPixelDensity());
}

CALayer* SkiaMetalCanvasProvider::getLayer() { return _layer; }

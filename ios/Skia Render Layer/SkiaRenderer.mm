//
//  SkiaRenderer.mm
//  VisionCamera
//
//  Created by Marc Rousavy on 19.07.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "SkiaRenderer.h"
#import <AVFoundation/AVFoundation.h>
#import <Metal/Metal.h>

#import "SkiaRenderContext.h"

#import <include/core/SkSurface.h>
#import <include/core/SkCanvas.h>
#import <include/core/SkColorSpace.h>

#import <include/gpu/mtl/GrMtlTypes.h>
#import <include/gpu/GrBackendSurface.h>
#import <include/gpu/ganesh/SkSurfaceGanesh.h>
#import <include/gpu/ganesh/mtl/SkSurfaceMetal.h>

#import "SkImageHelpers.h"

#import <system_error>
#import <memory>
#import <mutex>

@implementation SkiaRenderer {
  // The context we draw each Frame on
  std::unique_ptr<RenderContext> _offscreenContext;
  // The context the preview runs on
  std::unique_ptr<RenderContext> _layerContext;
  // The texture holding the drawn-to Frame
  id<MTLTexture> _texture;

  // For synchronization between the two Threads/Contexts
  std::mutex _textureMutex;
  std::atomic<bool> _hasNewFrame;
}

- (instancetype)init {
  if (self = [super init]) {
    _offscreenContext = std::make_unique<RenderContext>();
    _layerContext = std::make_unique<RenderContext>();
    _texture = nil;
    _hasNewFrame = false;
  }
  return self;
}

- (id<MTLDevice>)metalDevice {
  return _layerContext->device;
}

- (id<MTLTexture>)getTexture:(NSUInteger)width height:(NSUInteger)height {
  if (_texture == nil
      || _texture.width != width
      || _texture.height != height) {
    // Create new texture with the given width and height
    MTLTextureDescriptor* textureDescriptor = [MTLTextureDescriptor texture2DDescriptorWithPixelFormat:MTLPixelFormatBGRA8Unorm
                                                                                                 width:width
                                                                                                height:height
                                                                                             mipmapped:NO];
    textureDescriptor.usage = MTLTextureUsageRenderTarget | MTLTextureUsageShaderRead;
    _texture = [_offscreenContext->device newTextureWithDescriptor:textureDescriptor];
  }
  return _texture;
}

- (void)renderCameraFrameToOffscreenSurface:(CMSampleBufferRef)sampleBuffer withDrawCallback:(draw_callback_t)callback {
  // Wrap in auto release pool since we want the system to clean up after rendering
  @autoreleasepool {
    // Get the Frame's PixelBuffer
    CVImageBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer);
    if (pixelBuffer == nil) {
      throw std::runtime_error("SkiaRenderer: Pixel Buffer is corrupt/empty.");
    }

    // Lock Mutex to block the runLoop from overwriting the _currentDrawable
    std::unique_lock lock(_textureMutex);

    // Get the Metal Texture we use for in-memory drawing
    auto texture = [self getTexture:CVPixelBufferGetWidth(pixelBuffer)
                             height:CVPixelBufferGetHeight(pixelBuffer)];

    // Get & Lock the writeable Texture from the Metal Drawable

    GrMtlTextureInfo textureInfo;
    textureInfo.fTexture.retain((__bridge void*)texture);
    GrBackendRenderTarget backendRenderTarget((int)texture.width,
                                              (int)texture.height,
                                              1,
                                              textureInfo);

    auto context = _offscreenContext->skiaContext.get();

    // Create a Skia Surface from the writable Texture
    auto surface = SkSurfaces::WrapBackendRenderTarget(context,
                                                       backendRenderTarget,
                                                       kTopLeft_GrSurfaceOrigin,
                                                       kBGRA_8888_SkColorType,
                                                       SkColorSpace::MakeSRGB(),
                                                       nullptr);

    if (surface == nullptr || surface->getCanvas() == nullptr) {
      throw std::runtime_error("Skia surface could not be created from parameters.");
    }

    // Converts the CMSampleBuffer to an SkImage - RGB.
    CVPixelBufferLockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);
    auto image = SkImageHelpers::convertCMSampleBufferToSkImage(context, sampleBuffer);

    auto canvas = surface->getCanvas();

    // Clear everything so we keep it at a clean state
    canvas->clear(SkColors::kBlack);

    // Draw the Image into the Frame (aspectRatio: cover)
    // The Frame Processor might draw the Frame again (through render()) to pass a custom paint/shader,
    // but that'll just overwrite the existing one - no need to worry.
    canvas->drawImage(image, 0, 0);

    // Call the draw callback - probably a JS Frame Processor.
    callback(static_cast<void*>(canvas));

    // Flush all appended operations on the canvas and commit it to the SkSurface
    surface->flushAndSubmit();

    // Set dirty & free locks
    _hasNewFrame = true;
    lock.unlock();
    CVPixelBufferUnlockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);
  }
}

- (void)renderLatestFrameToLayer:(CALayer* _Nonnull)layer {
  if (!_hasNewFrame) {
    // No new Frame has arrived in the meantime.
    // We don't need to re-draw the texture to the screen if nothing has changed, abort.
    return;
  }

  @autoreleasepool {
    auto context = _layerContext->skiaContext.get();

    // Create a Skia Surface from the CAMetalLayer (use to draw to the View)
    GrMTLHandle drawableHandle;
    auto surface = SkSurfaces::WrapCAMetalLayer(context,
                                                (__bridge GrMTLHandle)layer,
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

    // Lock the Mutex so we can operate on the Texture atomically without
    // renderFrameToCanvas() overwriting in between from a different thread
    std::unique_lock lock(_textureMutex);

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
    auto image = SkImageHelpers::convertMTLTextureToSkImage(context, texture);

    // Draw the Texture (Frame) to the Canvas
    canvas->drawImage(image, 0, 0);

    // Restore the scale & transform
    canvas->restore();

    surface->flushAndSubmit();

    // Pass the drawable into the Metal Command Buffer and submit it to the GPU
    id<CAMetalDrawable> drawable = (__bridge id<CAMetalDrawable>)drawableHandle;
    id<MTLCommandBuffer> commandBuffer([_layerContext->commandQueue commandBuffer]);
    [commandBuffer presentDrawable:drawable];
    [commandBuffer commit];

    // Set flag back to false
    _hasNewFrame = false;
    lock.unlock();
  }
}

@end

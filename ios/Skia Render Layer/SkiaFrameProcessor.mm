//
//  SkiaFrameProcessor.mm
//  VisionCamera
//
//  Created by Marc Rousavy on 14.07.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "SkiaFrameProcessor.h"
#import <Metal/Metal.h>

#import <include/core/SkSurface.h>
#import <include/core/SkCanvas.h>
#import "SkImageHelpers.h"

@implementation SkiaFrameProcessor {
  // Metal/Skia Context
  OffscreenRenderContext _offscreenContext;
  
  // For synchronization between the two Threads/Contexts
  std::mutex _textureMutex;
  std::atomic<bool> _hasNewFrame;
}

- (instancetype)init {
  if (self = [super init]) {
    _offscreenContext = OffscreenRenderContext();
    _hasNewFrame = false;
  }
  return self;
}

- (void)renderLatestFrame:(render_block_t)callback {
  if (!_hasNewFrame) {
    // No new Frame has arrived in the meantime, we don't need to render.
    return;
  }
  
  // Lock the Mutex so we can operate on the Texture atomically without
  // renderFrameToCanvas() overwriting in between from a different thread
  std::unique_lock lock(_textureMutex);
  
  // Call the callback
  callback(_offscreenContext);
  
  // Set flag back to false
  _hasNewFrame = false;
  lock.unlock();
}

- (id<MTLTexture>)getTexture:(NSUInteger)width height:(NSUInteger)height {
  if (_offscreenContext.texture == nil
      || _offscreenContext.texture.width != width
      || _offscreenContext.texture.height != height) {
    // Create new texture with the given width and height
    MTLTextureDescriptor* textureDescriptor = [MTLTextureDescriptor texture2DDescriptorWithPixelFormat:MTLPixelFormatBGRA8Unorm
                                                                                                 width:width
                                                                                                height:height
                                                                                             mipmapped:NO];
    textureDescriptor.usage = MTLTextureUsageRenderTarget | MTLTextureUsageShaderRead;
    _offscreenContext.texture = [_offscreenContext.device newTextureWithDescriptor:textureDescriptor];
  }
  return _offscreenContext.texture;
}

- (void)call:(Frame*)frame {
  // Wrap in auto release pool since we want the system to clean up after rendering
  // and not wait until later - we've seen some example of memory usage growing very
  // fast in the simulator without this.
  @autoreleasepool {
    // Get the Frame's PixelBuffer
    CVImageBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
    if (pixelBuffer == nil) {
      throw std::runtime_error("Frame Processor: Pixel Buffer is corrupt/empty.");
    }

    // Lock Mutex to block the runLoop from overwriting the _currentDrawable
    std::unique_lock lock(_textureMutex);

    // Get the Metal Texture we use for in-memory drawing
    auto texture = [self getTexture:CVPixelBufferGetWidth(pixelBuffer)
                             height:CVPixelBufferGetHeight(pixelBuffer)];

    // Get & Lock the writeable Texture from the Metal Drawable
    GrMtlTextureInfo fbInfo;
    fbInfo.fTexture.retain((__bridge void*)texture);
    GrBackendRenderTarget backendRT((int)texture.width,
                                    (int)texture.height,
                                    1,
                                    fbInfo);

    auto context = _offscreenContext.skiaContext.get();

    // Create a Skia Surface from the writable Texture
    auto surface = SkSurface::MakeFromBackendRenderTarget(context,
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
    auto image = SkImageHelpers::convertCMSampleBufferToSkImage(context, frame.buffer);

    auto canvas = surface->getCanvas();

    // Clear everything so we keep it at a clean state
    canvas->clear(SkColors::kBlack);

    // Draw the Image into the Frame (aspectRatio: cover)
    // The Frame Processor might draw the Frame again (through render()) to pass a custom paint/shader,
    // but that'll just overwrite the existing one - no need to worry.
    canvas->drawImage(image, 0, 0);
    
// TODO: How to pass SkCanvas here?
    // Call the JS Frame Processor.
    [super call:frame];

    // Flush all appended operations on the canvas and commit it to the SkSurface
    surface->flushAndSubmit();

    _hasNewFrame = true;

    lock.unlock();
    CVPixelBufferUnlockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);
  }
}

@end

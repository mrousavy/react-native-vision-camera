#import "SkiaMetalCanvasProvider.h"

#import <AVFoundation/AVFoundation.h>
#import <Metal/Metal.h>

#import <include/core/SkColorSpace.h>
#import <include/core/SkSurface.h>
#import <include/core/SkCanvas.h>
#import <include/core/SkFont.h>
#import <include/gpu/ganesh/SkImageGanesh.h>
#import <include/gpu/GrDirectContext.h>

#import "SkImageHelpers.h"

#include <memory>

SkiaMetalCanvasProvider::SkiaMetalCanvasProvider(): std::enable_shared_from_this<SkiaMetalCanvasProvider>() {
  // Configure Metal Layer
  _layerContext.layer = [CAMetalLayer layer];
  _layerContext.layer.framebufferOnly = NO;
  _layerContext.layer.device = _layerContext.device;
  _layerContext.layer.opaque = false;
  _layerContext.layer.contentsScale = getPixelDensity();
  _layerContext.layer.pixelFormat = MTLPixelFormatBGRA8Unorm;
  // Set up DisplayLink
  _layerContext.displayLink = [[VisionDisplayLink alloc] init];

  _isValid = true;
}

SkiaMetalCanvasProvider::~SkiaMetalCanvasProvider() {
  _isValid = false;
  NSLog(@"VisionCamera: Stopping SkiaMetalCanvasProvider DisplayLink...");
  [_layerContext.displayLink stop];
}

void SkiaMetalCanvasProvider::setSkiaFrameProcessor(SkiaFrameProcessor* skiaFrameProcessor) {
  _frameProcessor = skiaFrameProcessor;
}

float SkiaMetalCanvasProvider::getPixelDensity() {
  return UIScreen.mainScreen.scale;
}

void SkiaMetalCanvasProvider::setSize(int width, int height) {
  _width = width;
  _height = height;
  _layerContext.layer.frame = CGRectMake(0, 0, width, height);
  _layerContext.layer.drawableSize = CGSizeMake(width * getPixelDensity(),
                                                height* getPixelDensity());
}

CALayer* SkiaMetalCanvasProvider::getLayer() { return _layerContext.layer; }


void SkiaMetalCanvasProvider::start() {
  NSLog(@"VisionCamera: Starting SkiaMetalCanvasProvider DisplayLink...");
  [_layerContext.displayLink start:[weakThis = weak_from_this()](double time) {
    auto thiz = weakThis.lock();
    if (thiz) {
      thiz->render();
    }
  }];
}

/**
 Callback from the DisplayLink - renders the current in-memory off-screen texture to the on-screen CAMetalLayer
 */
void SkiaMetalCanvasProvider::render() {
  if (_width == -1 && _height == -1) {
    // Width/Height are less than 0 meaning the view hasn't been laid out yet.
    return;
  }
  
  if (_frameProcessor == nil) {
    // No Frame Processor is set. We cannot render anything since Frames have to go through the Frame Processor first.
    return;
  }

  if (!_frameProcessor.hasNewFrame) {
    // No new Frame has arrived in the meantime.
    // We don't need to re-draw the texture to the screen if nothing has changed, abort.
    return;
  }

  auto context = _layerContext.skiaContext.get();

  // Create a Skia Surface from the CAMetalLayer (use to draw to the View)
  GrMTLHandle drawableHandle;
  auto surface = SkSurface::MakeFromCAMetalLayer(context,
                                                 (__bridge GrMTLHandle)_layerContext.layer,
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

  // Render the latest Frame from the Frame Processor. Internally this locks and gives us a texture with the already-drawn-to Frame.
  [_frameProcessor renderLatestFrame:^(const OffscreenRenderContext& offscreenContext) {
    auto texture = offscreenContext.texture;
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
    id<MTLCommandBuffer> commandBuffer([_layerContext.commandQueue commandBuffer]);
    [commandBuffer presentDrawable:drawable];
    [commandBuffer commit];
  }];
}

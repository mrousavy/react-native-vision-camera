//
//  CMSampleBuffer+toSkImage.m
//  VisionCamera
//
//  Created by Marc Rousavy on 23.11.22.
//  Copyright © 2022 mrousavy. All rights reserved.
//

#import "SkImageHelpers.h"
#import <AVFoundation/AVFoundation.h>
#import <Metal/Metal.h>

#import <include/core/SkColorSpace.h>
#import <include/core/SkSurface.h>
#import <include/core/SkCanvas.h>
#import <include/core/SkImage.h>
#import <include/gpu/ganesh/SkImageGanesh.h>
#import <include/gpu/mtl/GrMtlTypes.h>
#import <include/gpu/GrRecordingContext.h>

#include <TargetConditionals.h>
#if TARGET_RT_BIG_ENDIAN
#   define FourCC2Str(fourcc) (const char[]){*((char*)&fourcc), *(((char*)&fourcc)+1), *(((char*)&fourcc)+2), *(((char*)&fourcc)+3),0}
#else
#   define FourCC2Str(fourcc) (const char[]){*(((char*)&fourcc)+3), *(((char*)&fourcc)+2), *(((char*)&fourcc)+1), *(((char*)&fourcc)+0),0}
#endif

inline CVMetalTextureCacheRef getTextureCache() {
  static CVMetalTextureCacheRef textureCache = nil;
  if (textureCache == nil) {
    // Create a new Texture Cache
    auto result = CVMetalTextureCacheCreate(kCFAllocatorDefault,
                                            nil,
                                            MTLCreateSystemDefaultDevice(),
                                            nil,
                                            &textureCache);
    if (result != kCVReturnSuccess || textureCache == nil) {
      throw std::runtime_error("Failed to create Metal Texture Cache!");
    }
  }
  return textureCache;
}

sk_sp<SkImage> SkImageHelpers::convertCMSampleBufferToSkImage(GrRecordingContext* context, CMSampleBufferRef sampleBuffer) {
  auto pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer);
  double width = CVPixelBufferGetWidth(pixelBuffer);
  double height = CVPixelBufferGetHeight(pixelBuffer);
  
  // Make sure the format is RGB (BGRA_8888)
  auto format = CVPixelBufferGetPixelFormatType(pixelBuffer);
  if (format != kCVPixelFormatType_32BGRA) {
    auto error = std::string("VisionCamera: Frame has unknown Pixel Format (") + FourCC2Str(format) + std::string(") - cannot convert to SkImage!");
    throw std::runtime_error(error);
  }
  
  auto textureCache = getTextureCache();
  
  // Convert CMSampleBuffer* -> CVMetalTexture*
  CVMetalTextureRef cvTexture;
  CVMetalTextureCacheCreateTextureFromImage(kCFAllocatorDefault,
                                            textureCache,
                                            pixelBuffer,
                                            nil,
                                            MTLPixelFormatBGRA8Unorm,
                                            width,
                                            height,
                                            0, // plane index
                                            &cvTexture);
  auto mtlTexture = CVMetalTextureGetTexture(cvTexture);
  
  auto image = convertMTLTextureToSkImage(context, mtlTexture);
  
  // Release the Texture wrapper (it will still be strong)
  CFRelease(cvTexture);
  
  return image;
}

sk_sp<SkImage> SkImageHelpers::convertMTLTextureToSkImage(GrRecordingContext* context, id<MTLTexture> texture) {
  // Convert the rendered MTLTexture to an SkImage
  GrMtlTextureInfo textureInfo;
  textureInfo.fTexture.retain((__bridge void*)texture);
  GrBackendTexture backendTexture((int)texture.width,
                                  (int)texture.height,
                                  GrMipmapped::kNo,
                                  textureInfo);
  // TODO: Adopt or Borrow?
  auto image = SkImages::AdoptTextureFrom(context,
                                          backendTexture,
                                          kTopLeft_GrSurfaceOrigin,
                                          kBGRA_8888_SkColorType,
                                          kOpaque_SkAlphaType,
                                          SkColorSpace::MakeSRGB());
  return image;
}

SkRect SkImageHelpers::createCenterCropRect(SkRect sourceRect, SkRect destinationRect) {
  SkSize src;
  if (destinationRect.width() / destinationRect.height() > sourceRect.width() / sourceRect.height()) {
    src = SkSize::Make(sourceRect.width(), (sourceRect.width() * destinationRect.height()) / destinationRect.width());
  } else {
    src = SkSize::Make((sourceRect.height() * destinationRect.width()) / destinationRect.height(), sourceRect.height());
  }
  
  return inscribe(src, sourceRect);
}

SkRect SkImageHelpers::inscribe(SkSize size, SkRect rect) {
  auto halfWidthDelta = (rect.width() - size.width()) / 2.0;
  auto halfHeightDelta = (rect.height() - size.height()) / 2.0;
  return SkRect::MakeXYWH(rect.x() + halfWidthDelta,
                          rect.y() + halfHeightDelta,
                          size.width(),
                          size.height());
}


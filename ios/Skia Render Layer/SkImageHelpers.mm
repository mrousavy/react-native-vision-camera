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
#import <include/gpu/GrDirectContext.h>
#import <include/gpu/GrYUVABackendTextures.h>

SkImageHelpers::SkImageHelpers(id<MTLDevice> metalDevice, sk_sp<GrDirectContext> skContext): _metalDevice(metalDevice), _skContext(skContext) {
  // Create a new Texture Cache
  auto result = CVMetalTextureCacheCreate(kCFAllocatorDefault,
                                          nil,
                                          MTLCreateSystemDefaultDevice(),
                                          nil,
                                          &_textureCache);
  if (result != kCVReturnSuccess) {
    throw std::runtime_error("Failed to create Metal Texture Cache!");
  }
}

sk_sp<SkImage> SkImageHelpers::convertCMSampleBufferToSkImage(CMSampleBufferRef sampleBuffer) {
  auto pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer);
  
  double width = CVPixelBufferGetWidth(pixelBuffer);
  double height = CVPixelBufferGetHeight(pixelBuffer);
  
  // We assume that the CVPixelBuffer is in YCbCr format, so we have to create 2 textures:
  //  - for Y
  //  - for CbCr
  CVMetalTextureRef cvTextureY;
  CVMetalTextureCacheCreateTextureFromImage(kCFAllocatorDefault,
                                            _textureCache,
                                            pixelBuffer,
                                            nil,
                                            MTLPixelFormatR8Unorm,
                                            width,
                                            height,
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
                                            width / 2,
                                            height / 2,
                                            1, // plane index 1: CbCr
                                            &cvTextureCbCr);
  GrMtlTextureInfo textureInfoCbCr;
  auto mtlTextureCbCr = CVMetalTextureGetTexture(cvTextureCbCr);
  textureInfoCbCr.fTexture.retain((__bridge void*)mtlTextureCbCr);

  // Combine textures into array
  GrBackendTexture textures[] {
    GrBackendTexture(width,
                     height,
                     GrMipmapped::kNo,
                     textureInfoY),
    GrBackendTexture(width / 2,
                     height / 2,
                     GrMipmapped::kNo,
                     textureInfoCbCr)
  };
   
  // Create YUV map interpretation
  //  - k420 because we are assuming 420v
  //  - Y_UV because we have one Y texture, one UV (CbCr) texture
  //  - Limited YUV Color Space because we are assuming 420v (video). 420f would be Full
  SkYUVAInfo yuvInfo(SkISize::Make(width, height),
                     SkYUVAInfo::PlaneConfig::kY_UV,
                     SkYUVAInfo::Subsampling::k420,
                     SkYUVColorSpace::kRec709_Limited_SkYUVColorSpace);
  GrYUVABackendTextures yuvaTextures(yuvInfo,
                                     textures,
                                     kTopLeft_GrSurfaceOrigin);
  
  
  auto image = SkImage::MakeFromYUVATextures(_skContext.get(), yuvaTextures);
  
  CFRelease(cvTextureY);
  CFRelease(cvTextureCbCr);
  
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


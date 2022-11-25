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

#include <TargetConditionals.h>
#if TARGET_RT_BIG_ENDIAN
#   define FourCC2Str(fourcc) (const char[]){*((char*)&fourcc), *(((char*)&fourcc)+1), *(((char*)&fourcc)+2), *(((char*)&fourcc)+3),0}
#else
#   define FourCC2Str(fourcc) (const char[]){*(((char*)&fourcc)+3), *(((char*)&fourcc)+2), *(((char*)&fourcc)+1), *(((char*)&fourcc)+0),0}
#endif

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

SkYUVAInfo getSkYUVAInfoForPixelFormat(SkISize imageSize, OSType pixelFormat) {
  // Create YUV map interpretation
  //  - PlaneConfig::kY_UV means we have one plane for Y and one for UV (CbCr)
  //  - Subsampling::k420 means we have a 4:2:0 format for the ratio between Y and UV
  //  - ColorSpace::kRec709_Limited_SkYUVColorSpace means limited-range (video/luma=[16,235] chroma=[16,240]). 420f would be Full.
  
  switch (pixelFormat) {
      // y420
    case kCVPixelFormatType_420YpCbCr8Planar:
      return SkYUVAInfo(imageSize,
                        SkYUVAInfo::PlaneConfig::kY_UV,
                        SkYUVAInfo::Subsampling::k420,
                        SkYUVColorSpace::kRec709_Limited_SkYUVColorSpace);
      // f420
    case kCVPixelFormatType_420YpCbCr8PlanarFullRange:
      return SkYUVAInfo(imageSize,
                        SkYUVAInfo::PlaneConfig::kY_UV,
                        SkYUVAInfo::Subsampling::k420,
                        SkYUVColorSpace::kRec709_Full_SkYUVColorSpace);
      // 420v
    case kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange:
      return SkYUVAInfo(imageSize,
                        SkYUVAInfo::PlaneConfig::kY_UV,
                        SkYUVAInfo::Subsampling::k420,
                        SkYUVColorSpace::kRec709_Limited_SkYUVColorSpace);
      // 420f
    case kCVPixelFormatType_420YpCbCr8BiPlanarFullRange:
      return SkYUVAInfo(imageSize,
                        SkYUVAInfo::PlaneConfig::kY_UV,
                        SkYUVAInfo::Subsampling::k420,
                        SkYUVColorSpace::kRec709_Full_SkYUVColorSpace);
      // x420 (HDR video)
    case kCVPixelFormatType_420YpCbCr10BiPlanarVideoRange:
      return SkYUVAInfo(imageSize,
                        SkYUVAInfo::PlaneConfig::kY_UV,
                        SkYUVAInfo::Subsampling::k420,
                        SkYUVColorSpace::kBT2020_10bit_Limited_SkYUVColorSpace);
      // xf20 (HDR full)
    case kCVPixelFormatType_420YpCbCr10BiPlanarFullRange:
      return SkYUVAInfo(imageSize,
                        SkYUVAInfo::PlaneConfig::kY_UV,
                        SkYUVAInfo::Subsampling::k420,
                        SkYUVColorSpace::kBT2020_10bit_Full_SkYUVColorSpace);
    default:
      auto fourCharCode = @(FourCC2Str(pixelFormat));
      auto error = std::string("VisionCamera: Unknown YUV Format (") + fourCharCode.UTF8String + std::string(") - cannot convert to SkYUVAInfo.");
      throw std::runtime_error(error);
  }
}

sk_sp<SkImage> SkImageHelpers::convertCMSampleBufferToSkImage(CMSampleBufferRef sampleBuffer) {
  auto pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer);
  
  double width = CVPixelBufferGetWidth(pixelBuffer);
  double height = CVPixelBufferGetHeight(pixelBuffer);
  
  auto format = CVPixelBufferGetPixelFormatType(pixelBuffer);
  
  switch (format) {
    case kCVPixelFormatType_32BGRA: {
      // ------------- Format: RGB (BGRA 8888)
      auto srcBuff = CVPixelBufferGetBaseAddress(pixelBuffer);
      auto bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer);
      auto width = CVPixelBufferGetWidth(pixelBuffer);
      auto height = CVPixelBufferGetHeight(pixelBuffer);
      auto info = SkImageInfo::Make(width,
                                    height,
                                    kBGRA_8888_SkColorType,
                                    kOpaque_SkAlphaType);
      auto data = SkData::MakeWithoutCopy(srcBuff, bytesPerRow * height);
      auto image = SkImage::MakeRasterData(info, data, bytesPerRow);
      return image;
    }
      
    case kCVPixelFormatType_420YpCbCr8Planar:
    case kCVPixelFormatType_420YpCbCr8PlanarFullRange:
    case kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange:
    case kCVPixelFormatType_420YpCbCr8BiPlanarFullRange:
    case kCVPixelFormatType_420YpCbCr10BiPlanarVideoRange:
    case kCVPixelFormatType_420YpCbCr10BiPlanarFullRange: {
      // ------------- Format: YUV (420v, 420f, x420)
      // YCbCr (aka YUV) has two planes, one for Y, and one for CbCr
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
       
      SkYUVAInfo yuvInfo = getSkYUVAInfoForPixelFormat(SkISize::Make(width, height), format);
      GrYUVABackendTextures yuvaTextures(yuvInfo,
                                         textures,
                                         kTopLeft_GrSurfaceOrigin);
      
      
      auto image = SkImage::MakeFromYUVATextures(_skContext.get(), yuvaTextures);
      
      CFRelease(cvTextureY);
      CFRelease(cvTextureCbCr);
      
      return image;
    }
      
    default: {
      auto fourCharCode = @(FourCC2Str(format));
      auto error = std::string("Camera pushed a Frame with an unknown Pixel Format (") + fourCharCode.UTF8String + std::string(") - cannot convert to SkImage!");
      throw std::runtime_error(error);
    }
  }
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


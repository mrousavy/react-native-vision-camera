//
//  QRCodeFrameProcessorPlugin.m
//  VisionCameraExample
//
//  Created by Marc Rousavy on 01.05.21.
//

#import <Foundation/Foundation.h>
#import <VisionCamera/FrameProcessorPlugin.h>
#import <Vision/VNDetectBarcodesRequest.h>

@interface QRFrameProcessorPlugin : NSObject
@end

@implementation QRFrameProcessorPlugin

static inline id scanQRCodes(CMSampleBufferRef buffer) {
  return @[];
}

// Uncomment this line to register the above function as a frame processor
VISION_EXPORT_FRAME_PROCESSOR(scanQRCodes)

@end

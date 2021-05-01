//
//  QRFrameProcessorPluginObjC.m
//  VisionCameraExample
//
//  Created by Marc Rousavy on 01.05.21.
//

#import <Foundation/Foundation.h>
#import <VisionCamera/FrameProcessorPlugin.h>
#import <Vision/VNDetectBarcodesRequest.h>

// Example for an Objective-C Frame Processor plugin

@interface QRFrameProcessorPluginObjC : NSObject
@end

@implementation QRFrameProcessorPluginObjC

static inline id exampleObjC___scanQRCodes(CMSampleBufferRef buffer) {
  // TODO: Use some AI to detect QR codes in the CMSampleBufferRef
  return @[];
}

VISION_EXPORT_FRAME_PROCESSOR(exampleObjC___scanQRCodes)

@end

//
//  QRCodeFrameProcessorPluginObjC.m
//  VisionCameraExample
//
//  Created by Marc Rousavy on 01.05.21.
//

#import <Foundation/Foundation.h>
#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/Frame.h>

// Example for an Objective-C Frame Processor plugin

@interface QRCodeFrameProcessorPluginObjC : NSObject
@end

@implementation QRCodeFrameProcessorPluginObjC

static inline id exampleObjC___scanQRCodes(Frame* frame, NSArray* arguments) {
  // TODO: Use some AI to detect QR codes in the frame
  return @[];
}

VISION_EXPORT_FRAME_PROCESSOR(exampleObjC___scanQRCodes)

@end

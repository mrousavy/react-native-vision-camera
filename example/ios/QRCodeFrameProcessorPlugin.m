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

+ (id) callback:(CMSampleBufferRef)buffer {
  NSLog(@"Called with buffer!");
  return [NSNull null];
}

VISION_EXPORT_FRAME_PROCESSOR(scanQRCodes, callback)

@end

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

+ (id) scanQRCodes:(CMSampleBufferRef)buffer {
  NSLog(@"Called with buffer!");
  return [NSArray arrayWithObjects:@"test"];
}

VISION_EXPORT_FRAME_PROCESSOR(scanQRCodes)

@end

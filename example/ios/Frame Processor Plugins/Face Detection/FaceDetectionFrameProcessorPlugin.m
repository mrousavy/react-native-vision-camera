//
//  FaceDetection.m
//  VisionCameraExample
//
//  Created by Marc Rousavy on 04.05.23.
//

#import <Foundation/Foundation.h>
#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/Frame.h>

#import <FaceDetection/FaceDetection.h>


@interface FaceDetectionFrameProcessorPlugin : FrameProcessorPlugin <FaceDetectionDelegate>


- (instancetype)init;

@property FaceDetection* faceDetector;
@property NSArray<BoundingBox*>* currentDetections;

@end

@implementation FaceDetectionFrameProcessorPlugin

- (instancetype)init {
  if (self = [super init]) {
    _faceDetector = [[FaceDetection alloc] init];
    [_faceDetector startGraph];
    _faceDetector.delegate = self;
  }
  return self;
}

- (NSString *)name {
  return @"detectFaces";
}

// callback for the JS Frame Processor
- (id)callback:(Frame *)frame withArguments:(NSArray<id> *)arguments {
  CVPixelBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
  CMTime timestamp = CMSampleBufferGetPresentationTimeStamp(frame.buffer);
  @try {
    [_faceDetector processVideoFrame:pixelBuffer timestamp:timestamp];
  } @catch (NSException *exception) {
    NSLog(@"FD ERROR: %@", exception.reason);
  }
  
  NSMutableArray* faces = [NSMutableArray arrayWithCapacity:_currentDetections.count];
  for (int i = 0; i < _currentDetections.count; i++) {
    BoundingBox* box = _currentDetections[i];
    [faces addObject:@{
      @"x": @(box.x),
      @"y": @(box.y),
      @"width": @(box.width),
      @"height": @(box.height),
      @"score": @(box.score)
    }];
  }
  
  
  return @{
    @"faces": faces
  };
}

// callback for onFacesDetected (invoked on another thread)
- (void)faceDetection:(FaceDetection *)faceDetection didOutputDetections:(NSArray<BoundingBox *> *)detections {
  _currentDetections = detections;
}

+ (void) load {
  [self registerPlugin:[[FaceDetectionFrameProcessorPlugin alloc] init]];
}

@end

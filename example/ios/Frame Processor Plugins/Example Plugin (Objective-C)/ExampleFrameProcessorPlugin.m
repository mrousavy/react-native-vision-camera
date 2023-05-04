//
//  ExampleFrameProcessorPlugin.m
//  VisionCameraExample
//
//  Created by Marc Rousavy on 01.05.21.
//

#import <Foundation/Foundation.h>
#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/Frame.h>

#import <FaceDetection/FaceDetection.h>
#import <pthread.h>

// Example for an Objective-C Frame Processor plugin

@interface ExampleFrameProcessorPlugin : FrameProcessorPlugin <FaceDetectionDelegate>


- (instancetype)init;

@property FaceDetection* faceDetector;
@property pthread_mutex_t mutex;
@property NSArray<BoundingBox*>* currentDetections;

@end

@implementation ExampleFrameProcessorPlugin

- (instancetype)init {
  if (self = [super init]) {
    _faceDetector = [[FaceDetection alloc] init];
    [_faceDetector startGraph];
    _faceDetector.delegate = self;
    pthread_mutex_init(&_mutex, NULL);
  }
  return self;
}

- (NSString *)name {
  return @"example_plugin";
}

- (id)callback:(Frame *)frame withArguments:(NSArray<id> *)arguments {
  CVPixelBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
  CMTime timestamp = CMSampleBufferGetPresentationTimeStamp(frame.buffer);
  @try {
    [_faceDetector processVideoFrame:pixelBuffer timestamp:timestamp];
    // TODO: we don't do any locking for now since this deadlocks - pthread_mutex_lock(&_mutex);
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

+ (void) load {
  [self registerPlugin:[[ExampleFrameProcessorPlugin alloc] init]];
}

- (void)faceDetection:(FaceDetection *)faceDetection didOutputDetections:(NSArray<BoundingBox *> *)detections {
  _currentDetections = detections;
  // TODO: we don't do any locking for now since this deadlocks - pthread_mutex_unlock(&_mutex);
}

@end

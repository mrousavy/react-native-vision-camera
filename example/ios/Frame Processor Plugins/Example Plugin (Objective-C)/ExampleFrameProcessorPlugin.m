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
  [_faceDetector processVideoFrame:pixelBuffer timestamp:timestamp];
  pthread_mutex_lock(&_mutex);
  
  return @{
    @"detections": @(_currentDetections.count)
  };
}

+ (void) load {
  [self registerPlugin:[[ExampleFrameProcessorPlugin alloc] init]];
}

- (void)faceDetection:(FaceDetection *)faceDetection didOutputDetections:(NSArray<BoundingBox *> *)detections {
  _currentDetections = detections;
  pthread_mutex_unlock(&_mutex);
}

@end

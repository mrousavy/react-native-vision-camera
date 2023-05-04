//
//  HandDetectionFrameProcessorPlugin.m
//  VisionCameraExample
//
//  Created by Marc Rousavy on 04.05.23.
//

#import <Foundation/Foundation.h>
#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/Frame.h>

#import <MargeloTracking/HandTracking.h>

@interface HandDetectionFrameProcessorPlugin : FrameProcessorPlugin <HandTrackingDelegate>


- (instancetype)init;

@property HandTracking* handDetector;
@property NSArray<Hand*>* currentDetections;

@end

@implementation HandDetectionFrameProcessorPlugin

- (instancetype)init {
  if (self = [super init]) {
    _handDetector = [[HandTracking alloc] init];
    [_handDetector startGraph];
    _handDetector.delegate = self;
  }
  return self;
}

- (NSString *)name {
  return @"detectHands";
}

NSDictionary* landmarkToDict(Landmark* landmark) {
  return @{
    @"x": @(landmark.x),
    @"y": @(landmark.y),
    @"z": @(landmark.z)
  };
}

// callback for the JS Frame Processor
- (id)callback:(Frame *)frame withArguments:(NSArray<id> *)arguments {
  CVPixelBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
  CMTime timestamp = CMSampleBufferGetPresentationTimeStamp(frame.buffer);
  @try {
    [_handDetector processVideoFrame:pixelBuffer timestamp:timestamp];
  } @catch (NSException *exception) {
    NSLog(@"HD ERROR: %@", exception.reason);
  }
  
  NSMutableArray* hands = [NSMutableArray arrayWithCapacity:_currentDetections.count];
  for (int i = 0; i < _currentDetections.count; i++) {
    Hand* hand = _currentDetections[i];
    NSArray<Landmark*>* landmarks = hand.landmarks;
    [hands addObject:@{
      @"wrist": landmarkToDict(landmarks[0]),
      @"thumb_cmc": landmarkToDict(landmarks[1]),
      @"thumb_mcp": landmarkToDict(landmarks[2]),
      @"thumb_ip": landmarkToDict(landmarks[3]),
      @"thumb_tip": landmarkToDict(landmarks[4]),
      @"index_finger_mcp": landmarkToDict(landmarks[5]),
      @"index_finger_pip": landmarkToDict(landmarks[6]),
      @"index_finger_dip": landmarkToDict(landmarks[7]),
      @"index_finger_tip": landmarkToDict(landmarks[8]),
      @"middle_finger_mcp": landmarkToDict(landmarks[9]),
      @"middle_finger_pip": landmarkToDict(landmarks[10]),
      @"middle_finger_dip": landmarkToDict(landmarks[11]),
      @"middle_finger_tip": landmarkToDict(landmarks[12]),
      @"ring_finger_mcp": landmarkToDict(landmarks[13]),
      @"ring_finger_pip": landmarkToDict(landmarks[14]),
      @"ring_finger_dip": landmarkToDict(landmarks[15]),
      @"ring_finger_tip": landmarkToDict(landmarks[16]),
      @"pinky_mcp": landmarkToDict(landmarks[17]),
      @"pinky_pip": landmarkToDict(landmarks[18]),
      @"pinky_dip": landmarkToDict(landmarks[19]),
      @"pinky_tip": landmarkToDict(landmarks[20]),
    }];
  }
  
  
  return @{
    @"hands": hands
  };
}

// callback for onHandsDetected (invoked on another thread)
- (void)didOutputHandTracking:(NSArray<Hand *> *)hands {
  _currentDetections = hands;
}


+ (void) load {
  [self registerPlugin:[[HandDetectionFrameProcessorPlugin alloc] init]];
}


@end

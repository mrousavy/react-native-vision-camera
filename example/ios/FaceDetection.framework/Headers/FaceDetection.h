#import <Foundation/Foundation.h>
#import <CoreVideo/CoreVideo.h>
#import <CoreMedia/CoreMedia.h>

@class FaceDetection;
@class BoundingBox;

@interface BoundingBox: NSObject
@property (nonatomic) float x;
@property (nonatomic) float y;
@property (nonatomic) float width;
@property (nonatomic) float height;
@end

@protocol FaceDetectionDelegate <NSObject>
- (void)faceDetection: (FaceDetection*)faceDetection didOutputDetections: (NSArray<BoundingBox*>*)detections;
@end

@interface FaceDetection: NSObject
-(instancetype) init;
-(void) startGraph;
-(void) processVideoFrame: (CVPixelBufferRef)imageBuffer timestamp:(CMTime)timestamp;
@property (weak, nonatomic) id <FaceDetectionDelegate> delegate;
@end

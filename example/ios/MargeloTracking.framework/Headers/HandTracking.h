#import <Foundation/Foundation.h>
#import <CoreVideo/CoreVideo.h>
#import <CoreMedia/CoreMedia.h>

@class Hand;
@class Landmark;

@interface Landmark: NSObject
@property (nonatomic) float x;
@property (nonatomic) float y;
@property (nonatomic) float z;
@end

@interface Hand: NSObject
@property (nonatomic) NSArray<Landmark*>* landmarks;
@end

@protocol HandTrackingDelegate <NSObject>
- (void)didOutputHandTracking:(NSArray<Hand*>*)hands;
@end

@interface HandTracking: NSObject
-(instancetype) init;
-(void) startGraph;
-(void) processVideoFrame: (CVPixelBufferRef)imageBuffer timestamp:(CMTime)timestamp;
@property (weak, nonatomic) id <HandTrackingDelegate> delegate;
@end

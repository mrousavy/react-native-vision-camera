#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTViewManager.h>
#import <AVFoundation/AVCaptureAudioDataOutput.h>
#import <AVFoundation/AVCaptureVideoDataOutput.h>
#import "CameraNativeComponentSpec.h"


NS_ASSUME_NONNULL_BEGIN

@interface CameraModule : NSObject <NativeCameraModuleSpec>
    +(void) setCurrentCamera:(UIView*)view;
@end

NS_ASSUME_NONNULL_END
#endif

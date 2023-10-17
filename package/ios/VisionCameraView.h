// This guard prevent this file to be compiled in the old architecture.
#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

#ifndef VisionCameraViewNativeComponent_h
#define VisionCameraViewNativeComponent_h

NS_ASSUME_NONNULL_BEGIN

@interface VisionCameraView : RCTViewComponentView
@end

NS_ASSUME_NONNULL_END

#endif /* VisionCameraViewNativeComponent_h */
#endif /* RCT_NEW_ARCH_ENABLED */

#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import "VisionCameraExample-Swift.h"
#if VISION_CAMERA_ENABLE_FRAME_PROCESSORS
#import <VisionCamera/FrameProcessorPlugin.h>
#endif

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"VisionCameraExample";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

#if VISION_CAMERA_ENABLE_FRAME_PROCESSORS
  [FrameProcessorPlugin registerPlugin:[[ExamplePluginSwift alloc] init]];
#endif

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end

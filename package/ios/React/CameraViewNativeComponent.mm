//
//  CameraViewNativeComponent.m
//  VisionCamera
//
//  Created by Hanno Gödecke on 18.10.24.
//

#import "CameraViewNativeComponent.h"

#import <react/renderer/components/RNVisionCameraSpec/ComponentDescriptors.h>
#import <react/renderer/components/RNVisionCameraSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"

#if __has_include(<VisionCamera/VisionCamera-Swift.h>)
#import <VisionCamera/VisionCamera-Swift.h>
#else
#import "VisionCamera-Swift.h"
#endif

using namespace facebook::react;

@interface CameraViewNativeComponent() <RCTCameraViewViewProtocol, CameraViewDirectEventDelegate>
@end

@implementation CameraViewNativeComponent {
    CameraView * _view;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<CameraViewComponentDescriptor>();
}


- (void) initCamera {
    static const auto defaultProps = std::make_shared<const CameraViewProps>();
    _props = defaultProps;
    
    _view = [[CameraView alloc] init];
    _view.eventDelegate = self;
    
    self.contentView = _view;
}

- (instancetype)initWithFrame:(CGRect)frame
{
    self = [super initWithFrame:frame];
    if (self) {
        [self initCamera];
    }
    
    return self;
}

- (void)emitOnAverageFpsChangedEvent:(NSDictionary<NSString *,id> * _Nonnull)message {
    if (_eventEmitter) {
        return;
    }
    
    std::shared_ptr<const CameraViewEventEmitter> emitter = std::static_pointer_cast<const CameraViewEventEmitter>(_eventEmitter);
    
    CameraViewEventEmitter::OnAverageFpsChanged payload = {
        .averageFps = [[message objectForKey:@"averageFps"] doubleValue]
    };
    
    emitter->onAverageFpsChanged(payload);
}

- (void)emitOnCodeScannedEvent:(NSDictionary<NSString *,id> * _Nonnull)message {
    <#code#>
}

- (void)emitOnErrorEvent:(NSDictionary<NSString *,id> * _Nonnull)error {
    <#code#>
}

- (void)emitOnInitializedEvent {
    <#code#>
}

- (void)emitOnOutputOrientationChangedEvent:(NSDictionary<NSString *,id> * _Nonnull)message {
    <#code#>
}

- (void)emitOnPreviewOrientationChangedEvent:(NSDictionary<NSString *,id> * _Nonnull)message {
    <#code#>
}

- (void)emitOnPreviewStartedEvent {
    <#code#>
}

- (void)emitOnPreviewStoppedEvent {
    <#code#>
}

- (void)emitOnShutterEvent:(NSDictionary<NSString *,id> * _Nonnull)message {
    <#code#>
}

- (void)emitOnStartedEvent {
    <#code#>
}

- (void)emitOnStoppedEvent {
    <#code#>
}

- (void)emitOnViewReadyEvent {
    <#code#>
}

@end

Class<RCTComponentViewProtocol> CameraViewCls(void)
{
    return CameraViewNativeComponent.class;
}

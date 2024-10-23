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

#import <AVFoundation/AVFoundation.h>
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
    if (!_eventEmitter) {
        return;
    }
    
    std::shared_ptr<const CameraViewEventEmitter> emitter = std::static_pointer_cast<const CameraViewEventEmitter>(_eventEmitter);
    
    CameraViewEventEmitter::OnAverageFpsChanged payload = {
        .averageFps = [[message objectForKey:@"averageFps"] doubleValue]
    };
    
    emitter->onAverageFpsChanged(payload);
}

- (void)emitOnCodeScannedEvent:(NSDictionary<NSString *,id> * _Nonnull)message {
    if (!_eventEmitter) {
        return;
    }
    
    std::shared_ptr<const CameraViewEventEmitter> emitter = std::static_pointer_cast<const CameraViewEventEmitter>(_eventEmitter);
    
    // TODO: implement
}

- (void)emitOnErrorEvent:(NSDictionary<NSString *,id> * _Nonnull)error {
    // TODO: implement
}

- (void)emitOnInitializedEvent {
    if (!_eventEmitter) {
        return;
    }
    
    std::shared_ptr<const CameraViewEventEmitter> emitter = std::static_pointer_cast<const CameraViewEventEmitter>(_eventEmitter);
    
    emitter->onInitialized({});
}

- (void)emitOnOutputOrientationChangedEvent:(NSDictionary<NSString *,id> * _Nonnull)message {
    // TODO: implement
}

- (void)emitOnPreviewOrientationChangedEvent:(NSDictionary<NSString *,id> * _Nonnull)message {
    // TODO: implement
}

- (void)emitOnPreviewStartedEvent {
    if (!_eventEmitter) {
        return;
    }
    
    std::shared_ptr<const CameraViewEventEmitter> emitter = std::static_pointer_cast<const CameraViewEventEmitter>(_eventEmitter);
    
    emitter->onPreviewStarted({});
}

- (void)emitOnPreviewStoppedEvent {
    if (!_eventEmitter) {
        return;
    }
    
    std::shared_ptr<const CameraViewEventEmitter> emitter = std::static_pointer_cast<const CameraViewEventEmitter>(_eventEmitter);
    
    emitter->onPreviewStopped({});
}

- (void)emitOnShutterEvent:(NSDictionary<NSString *,id> * _Nonnull)message {
    if (!_eventEmitter) {
        return;
    }
    
    std::shared_ptr<const CameraViewEventEmitter> emitter = std::static_pointer_cast<const CameraViewEventEmitter>(_eventEmitter);
    
    CameraViewEventEmitter::OnShutter payload = {
        .type = std::string([[message objectForKey:@"type"] UTF8String])
    };
    emitter->onShutter(payload);
}

- (void)emitOnStartedEvent {
    if (!_eventEmitter) {
        return;
    }
    
    std::shared_ptr<const CameraViewEventEmitter> emitter = std::static_pointer_cast<const CameraViewEventEmitter>(_eventEmitter);
    
    emitter->onStarted({});
}

- (void)emitOnStoppedEvent {
    if (!_eventEmitter) {
        return;
    }
    
    std::shared_ptr<const CameraViewEventEmitter> emitter = std::static_pointer_cast<const CameraViewEventEmitter>(_eventEmitter);
    
    emitter->onStopped({});
}

- (void)emitOnViewReadyEvent {
    if (!_eventEmitter) {
        return;
    }
    
    std::shared_ptr<const CameraViewEventEmitter> emitter = std::static_pointer_cast<const CameraViewEventEmitter>(_eventEmitter);
    
    emitter->onViewReady({});
}

@end

Class<RCTComponentViewProtocol> CameraViewCls(void)
{
    return CameraViewNativeComponent.class;
}

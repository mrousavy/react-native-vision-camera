// This guard prevent the code from being compiled in the old architecture
#ifdef RCT_NEW_ARCH_ENABLED
#import "RNCameraView.h"

#import <react/renderer/components/CameraNativeComponentSpec/ComponentDescriptors.h>
#import <react/renderer/components/CameraNativeComponentSpec/EventEmitters.h>
#import <react/renderer/components/CameraNativeComponentSpec/Props.h>
#import <react/renderer/components/CameraNativeComponentSpec/RCTComponentViewHelpers.h>

#import "CameraModule.h"
#import "RCTFabricComponentsPlugins.h"
#import <AVFoundation/AVCaptureAudioDataOutput.h>
#import <AVFoundation/AVCaptureVideoDataOutput.h>
#import <React/RCTViewManager.h>
#import <React/RCTConversions.h>
#import "VisionCamera-Swift.h"

using namespace facebook::react;

@implementation RNCameraView {
    CameraView * _view;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
    return concreteComponentDescriptorProvider<CameraViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
    self = [super initWithFrame:frame];
if (self) {
    static const auto defaultProps = std::make_shared<const CameraViewProps>();
    _props = defaultProps;

    //The remaining part of the initializer is standard Objective-C code to create views and layout them with AutoLayout. Here we can change whatever we want to.
    _view = [[CameraView alloc] init];
    [CameraModule setCurrentCamera:_view];

    self.contentView = _view;
}

return self;
}

// why we need this func -> https://reactnative.dev/docs/next/the-new-architecture/pillars-fabric-components#write-the-native-ios-code
- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
    const auto &newViewProps = *std::static_pointer_cast<CameraViewProps const>(props);
    
    
    if(_view.isActive != newViewProps.isActive){
        _view.isActive = newViewProps.isActive;
    }
    
    if(_view.cameraId != RCTNSStringFromString(newViewProps.cameraId)){
        _view.cameraId = RCTNSStringFromString(newViewProps.cameraId);
    }
    if(_view.enableDepthData != newViewProps.enableDepthData){
        _view.enableDepthData = newViewProps.enableDepthData;
    }
    if(_view.enableHighQualityPhotos != [NSNumber numberWithBool:newViewProps.enableHighQualityPhotos]){
        _view.enableHighQualityPhotos = [NSNumber numberWithBool:newViewProps.enableHighQualityPhotos];
    }
    if(_view.enablePortraitEffectsMatteDelivery != newViewProps.enablePortraitEffectsMatteDelivery){
        _view.enablePortraitEffectsMatteDelivery = newViewProps.enablePortraitEffectsMatteDelivery;
    }
    if(_view.photo != [NSNumber numberWithBool:newViewProps.photo]){
        _view.photo = [NSNumber numberWithBool:newViewProps.photo];
    }
    if(_view.video != [NSNumber numberWithBool:newViewProps.video]){
        _view.video = [NSNumber numberWithBool:newViewProps.video];
    }
    if(_view.audio != [NSNumber numberWithBool:newViewProps.audio]){
        _view.audio = [NSNumber numberWithBool:newViewProps.audio];
    }
    if(_view.enableFrameProcessor != newViewProps.enableFrameProcessor){
        _view.enableFrameProcessor = newViewProps.enableFrameProcessor;
    }
//    if(_view.format != newViewProps.format){
//        _view.format = newViewProps.format;
//    }

    if(_view.fps != [NSNumber numberWithInt:newViewProps.fps]){
        _view.fps = [NSNumber numberWithInt:newViewProps.fps];
    }
    if(_view.frameProcessorFps != [NSNumber numberWithInt:newViewProps.frameProcessorFps]){
        _view.frameProcessorFps = [NSNumber numberWithInt:newViewProps.frameProcessorFps];
    }
    if(_view.hdr != [NSNumber numberWithInt:newViewProps.hdr]){
        _view.hdr = [NSNumber numberWithInt:newViewProps.hdr];
    }
    if(_view.lowLightBoost != [NSNumber numberWithInt:newViewProps.lowLightBoost]){
        _view.lowLightBoost = [NSNumber numberWithInt:newViewProps.lowLightBoost];
    }
    if(_view.colorSpace != RCTNSStringFromString(newViewProps.colorSpace)){
        _view.colorSpace = RCTNSStringFromString(newViewProps.colorSpace);
    }
    if(_view.videoStabilizationMode != RCTNSStringFromString(newViewProps.videoStabilizationMode)){
        _view.videoStabilizationMode = RCTNSStringFromString(newViewProps.videoStabilizationMode);
    }
    
    if(_view.preset != RCTNSStringFromString(newViewProps.preset)){
        _view.preset = RCTNSStringFromString(newViewProps.preset);
    }

    if(_view.torch != RCTNSStringFromString(newViewProps.torch)){
        _view.torch = RCTNSStringFromString(newViewProps.torch);
    }

    if(_view.orientation != RCTNSStringFromString(newViewProps.orientation)){
        _view.orientation = RCTNSStringFromString(newViewProps.orientation);
    }
    
    if(_view.zoom != [NSNumber numberWithDouble:newViewProps.zoom]){
        _view.zoom = [NSNumber numberWithDouble:newViewProps.zoom];
    }
    
    if(_view.enableZoomGesture != newViewProps.enableZoomGesture){
        _view.enableZoomGesture = newViewProps.enableZoomGesture;
    }


    [super updateProps:props oldProps:oldProps];
}

Class<RCTComponentViewProtocol> CameraViewCls(void)
{
    return RNCameraView.class;
}

@end
#endif

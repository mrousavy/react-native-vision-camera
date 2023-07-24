// This guard prevent the code from being compiled in the old architecture
#ifdef RCT_NEW_ARCH_ENABLED
//#import "RNCameraView.h"
#import <React/RCTViewComponentView.h>

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

@interface RNCameraView : RCTViewComponentView <RNCameraViewDirectEventDelegate>
@end


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
    NSLog(@"TESTING VIEW INIT");
    _props = defaultProps;

    //The remaining part of the initializer is standard Objective-C code to create views and layout them with AutoLayout. Here we can change whatever we want to.
    _view = [[CameraView alloc] init];
    _view.delegate = self;
    [CameraModule setCurrentCamera:_view];
    

    self.contentView = _view;
}

return self;
}

// why we need this func -> https://reactnative.dev/docs/next/the-new-architecture/pillars-fabric-components#write-the-native-ios-code
- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
    const auto &newViewProps = *std::static_pointer_cast<CameraViewProps const>(props);
    const auto &oldViewProps = *std::static_pointer_cast<CameraViewProps const>(_props);
    
    NSMutableArray* changedProps = [[NSMutableArray alloc] init];
    
    if(oldViewProps.isActive != newViewProps.isActive){
        _view.isActive = newViewProps.isActive;
        [changedProps addObject:@"isActive"];
    }
    if(oldViewProps.cameraId != newViewProps.cameraId){
        _view.cameraId = RCTNSStringFromString(newViewProps.cameraId);
        [changedProps addObject:@"cameraId"];
    }
    if(oldViewProps.enableDepthData != newViewProps.enableDepthData){
        _view.enableDepthData = newViewProps.enableDepthData;
        [changedProps addObject:@"enableDepthData"];
    }
    if(oldViewProps.enableHighQualityPhotos != newViewProps.enableHighQualityPhotos){
        _view.enableHighQualityPhotos = [NSNumber numberWithBool:newViewProps.enableHighQualityPhotos];
        [changedProps addObject:@"enableHighQualityPhotos"];
    }
    if(oldViewProps.enablePortraitEffectsMatteDelivery != newViewProps.enablePortraitEffectsMatteDelivery){
        _view.enablePortraitEffectsMatteDelivery = newViewProps.enablePortraitEffectsMatteDelivery;
        [changedProps addObject:@"enablePortraitEffectsMatteDelivery"];
    }
    if(oldViewProps.photo != newViewProps.photo){
        _view.photo = [NSNumber numberWithBool:newViewProps.photo];
        [changedProps addObject:@"photo"];
    }
    if(oldViewProps.video != newViewProps.video){
        _view.video = [NSNumber numberWithBool:newViewProps.video];
        [changedProps addObject:@"video"];
    }
    if(oldViewProps.audio != newViewProps.audio){
        _view.audio = [NSNumber numberWithBool:newViewProps.audio];
        [changedProps addObject:@"audio"];
    }
    if(oldViewProps.enableFrameProcessor != newViewProps.enableFrameProcessor){
        _view.enableFrameProcessor = newViewProps.enableFrameProcessor;
        [changedProps addObject:@"enableFrameProcessor"];
    }
    if(oldViewProps.fps != newViewProps.fps){
        _view.fps = [NSNumber numberWithInt:newViewProps.fps];
        [changedProps addObject:@"fps"];
    }
    if(oldViewProps.frameProcessorFps != newViewProps.frameProcessorFps){
        _view.frameProcessorFps = [NSNumber numberWithInt:newViewProps.frameProcessorFps];
        [changedProps addObject:@"frameProcessorFps"];
    }
    if(oldViewProps.hdr != newViewProps.hdr){
        _view.hdr = [NSNumber numberWithInt:newViewProps.hdr];
        [changedProps addObject:@"hdr"];
    }
    if(oldViewProps.lowLightBoost != newViewProps.lowLightBoost){
        _view.lowLightBoost = [NSNumber numberWithInt:newViewProps.lowLightBoost];
        [changedProps addObject:@"lowLightBoost"];
    }
    if(oldViewProps.colorSpace != newViewProps.colorSpace){
        _view.colorSpace = RCTNSStringFromString(newViewProps.colorSpace);
        [changedProps addObject:@"colorSpace"];
    }
    if(oldViewProps.videoStabilizationMode != newViewProps.videoStabilizationMode){
        _view.videoStabilizationMode = RCTNSStringFromString(newViewProps.videoStabilizationMode);
        [changedProps addObject:@"videoStabilizationMode"];
    }
    if(oldViewProps.preset != newViewProps.preset){ // Empty preset string breaks starting of the session
        _view.preset = RCTNSStringFromString(newViewProps.preset);
        [changedProps addObject:@"preset"];
    }
    if(oldViewProps.torch != newViewProps.torch){
        _view.torch = RCTNSStringFromString(newViewProps.torch);
        [changedProps addObject:@"torch"];
    }
    if(oldViewProps.orientation != newViewProps.orientation){
        _view.orientation = RCTNSStringFromString(newViewProps.orientation);
        [changedProps addObject:@"orientation"];
    }
    if(oldViewProps.zoom != newViewProps.zoom){
        _view.zoom = [NSNumber numberWithDouble:newViewProps.zoom];
        [changedProps addObject:@"zoom"];
    }
    if(oldViewProps.enableZoomGesture != newViewProps.enableZoomGesture){
        _view.enableZoomGesture = newViewProps.enableZoomGesture;
        [changedProps addObject:@"enableZoomGesture"];
    }
    
//    if(&oldViewProps.format != &newViewProps.format){
//        _view.format = @{@"autoFocusSystem": @"phase-detection", @"colorSpaces": @[@"srgb"], @"fieldOfView": @106.1700439453125, @"isHighestPhotoQualitySupported": @false, @"frameRateRanges": @[@{@"maxFrameRate": @60, @"minFrameRate": @1}], @"maxISO": @3264, @"maxZoom": @121.875, @"minISO": @34, @"photoHeight": @2340, @"photoWidth": @4160, @"pixelFormat": @"420v", @"supportsPhotoHDR": @false, @"supportsVideoHDR": @true, @"videoHeight": @1080, @"videoStabilizationModes": @[@"auto", @"cinematic", @"off", @"standard", @"cinematic-extended"], @"videoWidth": @1920};
//        [changedProps addObject:@"format"];
//        NSLog(@"TESTING UPDATING FORMAT");
//    }
    
        
    if(_view.format == nil){
        _view.format =[ [NSMutableDictionary alloc] init];
    }
    
    //Checking format props, TODO: find cleaner way to do it
    if(oldViewProps.format.autoFocusSystem != newViewProps.format.autoFocusSystem){
        [_view.format setValue:RCTNSStringFromString(newViewProps.format.autoFocusSystem) forKey:@"autoFocusSystem"];
        NSLog(@" TESTING CHANGED FORMAT autoFocusSystem");
        [changedProps addObject:@"format"];
    }
    if(oldViewProps.format.pixelFormat != newViewProps.format.pixelFormat){
        [_view.format setValue:RCTNSStringFromString(newViewProps.format.pixelFormat) forKey:@"pixelFormat"];
        NSLog(@" TESTING CHANGED FORMAT pixelFormat");
        [changedProps addObject:@"format"];
    }
    
    if(oldViewProps.format.videoStabilizationModes.size() != newViewProps.format.videoStabilizationModes.size()){
        NSMutableArray* newVideoStabilizationModes = [[NSMutableArray alloc] init];
        for(int i = 0; i < newViewProps.format.videoStabilizationModes.size(); i++){
            [newVideoStabilizationModes addObject:RCTNSStringFromString(newViewProps.format.videoStabilizationModes.at(i))];
        }
        [_view.format setValue:newVideoStabilizationModes forKey:@"videoStabilizationModes"];
        NSLog(@" TESTING CHANGED FORMAT videoStabilizationModes");
        [changedProps addObject:@"format"];
    }
    
    if(oldViewProps.format.colorSpaces.size() != newViewProps.format.colorSpaces.size()){
        NSMutableArray* newColorSpaces = [[NSMutableArray alloc] init];
        for(int i = 0; i < newViewProps.format.colorSpaces.size(); i++){
            [newColorSpaces addObject:RCTNSStringFromString(newViewProps.format.colorSpaces.at(i))];
        }
        [_view.format setValue:newColorSpaces forKey:@"colorSpaces"];
        NSLog(@" TESTING CHANGED FORMAT colorSpaces");
        [changedProps addObject:@"format"];
    }
    
    if(oldViewProps.format.frameRateRanges.size() != newViewProps.format.frameRateRanges.size()){
        NSMutableArray* newFrameRateRanges = [[NSMutableArray alloc] init];
        for(int i = 0; i < newViewProps.format.frameRateRanges.size(); i++){
            [newFrameRateRanges addObject:@{@"minFrameRate": [NSNumber numberWithInt:newViewProps.format.frameRateRanges.at(i).minFrameRate], @"maxFrameRate": [NSNumber numberWithInt:newViewProps.format.frameRateRanges.at(i).maxFrameRate]}];
        }
        [_view.format setValue:newFrameRateRanges forKey:@"frameRateRanges"];
        NSLog(@" TESTING CHANGED FORMAT frameRateRanges");
        [changedProps addObject:@"format"];
    }
    
    if(oldViewProps.format.photoHeight != newViewProps.format.photoHeight){
        [_view.format setValue:[NSNumber numberWithDouble:newViewProps.format.photoHeight] forKey:@"photoHeight"];
        NSLog(@" TESTING CHANGED FORMAT photoHeight");
        [changedProps addObject:@"format"];
    }
    if(oldViewProps.format.photoWidth != newViewProps.format.photoWidth){
        [_view.format setValue:[NSNumber numberWithDouble:newViewProps.format.photoWidth] forKey:@"photoWidth"];
        NSLog(@" TESTING CHANGED FORMAT photoWidth");
        [changedProps addObject:@"format"];
    }
    if(oldViewProps.format.videoHeight != newViewProps.format.videoHeight){
        [_view.format setValue:[NSNumber numberWithDouble:newViewProps.format.videoHeight] forKey:@"videoHeight"];
        NSLog(@" TESTING CHANGED FORMAT videoHeight");
        [changedProps addObject:@"format"];
    }
    if(oldViewProps.format.videoWidth != newViewProps.format.videoWidth){
        [_view.format setValue:[NSNumber numberWithDouble:newViewProps.format.videoWidth] forKey:@"videoWidth"];
        NSLog(@" TESTING CHANGED FORMAT videoWidth");
        [changedProps addObject:@"format"];
    }
    if(oldViewProps.format.maxISO != newViewProps.format.maxISO){
        [_view.format setValue:[NSNumber numberWithDouble:newViewProps.format.maxISO] forKey:@"maxISO"];
        NSLog(@" TESTING CHANGED FORMAT maxISO");
        [changedProps addObject:@"format"];
    }
    if(oldViewProps.format.minISO != newViewProps.format.minISO){
        [_view.format setValue:[NSNumber numberWithDouble:newViewProps.format.minISO] forKey:@"minISO"];
        NSLog(@" TESTING CHANGED FORMAT minISO");
        [changedProps addObject:@"format"];
    }
    if(oldViewProps.format.fieldOfView != newViewProps.format.fieldOfView){
        [_view.format setValue:[NSNumber numberWithDouble:newViewProps.format.fieldOfView] forKey:@"fieldOfView"];
        NSLog(@" TESTING CHANGED FORMAT fieldOfView");
        [changedProps addObject:@"format"];
    }
    if(oldViewProps.format.maxZoom != newViewProps.format.maxZoom){
        [_view.format setValue:[NSNumber numberWithDouble:newViewProps.format.maxZoom] forKey:@"maxZoom"];
        NSLog(@" TESTING CHANGED FORMAT maxZoom");
        [changedProps addObject:@"format"];
    }
    
    if(oldViewProps.format.isHighestPhotoQualitySupported != newViewProps.format.isHighestPhotoQualitySupported){
        NSNumber* isHighestPhotoQualitySupported = newViewProps.format.isHighestPhotoQualitySupported ? @1 : @0;
        [_view.format setValue:isHighestPhotoQualitySupported forKey:@"isHighestPhotoQualitySupported"];
        NSLog(@" TESTING CHANGED FORMAT isHighestPhotoQualitySupported");
        [changedProps addObject:@"format"];
    }

    if(oldViewProps.format.supportsVideoHDR != newViewProps.format.supportsVideoHDR){
        NSNumber* supportsVideoHDR = newViewProps.format.supportsVideoHDR ? @1 : @0;
        [_view.format setValue:supportsVideoHDR forKey:@"supportsVideoHDR"];
        NSLog(@" TESTING CHANGED FORMAT supportsVideoHDR");
        [changedProps addObject:@"format"];
    }

    [_view didSetProps:changedProps];

    [super updateProps:props oldProps:oldProps];
}

- (void)onViewReady{
    NSLog(@"TESTING onViewReady");
    if(_eventEmitter){
        std::dynamic_pointer_cast<const CameraViewEventEmitter>(_eventEmitter)
        ->onViewReady( CameraViewEventEmitter::OnViewReady{});
    }
}

- (void)onError{
    NSLog(@"TESTING onError");
    if(_eventEmitter){
        std::dynamic_pointer_cast<const CameraViewEventEmitter>(_eventEmitter)
        ->onError( CameraViewEventEmitter::OnError{});
    }
}

- (void)onInitialized{
    NSLog(@"TESTING onInitialized");
    if(_eventEmitter){
        std::dynamic_pointer_cast<const CameraViewEventEmitter>(_eventEmitter)
        ->onInitialized( CameraViewEventEmitter::OnInitialized{});
    }
}

Class<RCTComponentViewProtocol> CameraViewCls(void)
{
    return RNCameraView.class;
}

@end
#endif

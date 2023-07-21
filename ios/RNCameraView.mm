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
    
    NSLog(@"TESTING SETTING IS ACTIVE %i", newViewProps.isActive);
    if(_view.isActive != newViewProps.isActive){
        _view.isActive = newViewProps.isActive;
        [changedProps addObject:@"isActive"];
    }
    
    if(_view.cameraId != RCTNSStringFromString(newViewProps.cameraId) && RCTNSStringFromString(newViewProps.cameraId).length > 0){
        _view.cameraId = RCTNSStringFromString(newViewProps.cameraId);
        [changedProps addObject:@"cameraId"];
    }
    if(_view.enableDepthData != newViewProps.enableDepthData){
        _view.enableDepthData = newViewProps.enableDepthData;
        [changedProps addObject:@"enableDepthData"];
    }
    if(_view.enableHighQualityPhotos != [NSNumber numberWithBool:newViewProps.enableHighQualityPhotos]){
        _view.enableHighQualityPhotos = [NSNumber numberWithBool:newViewProps.enableHighQualityPhotos];
        [changedProps addObject:@"enableHighQualityPhotos"];
    }
    if(_view.enablePortraitEffectsMatteDelivery != newViewProps.enablePortraitEffectsMatteDelivery){
        _view.enablePortraitEffectsMatteDelivery = newViewProps.enablePortraitEffectsMatteDelivery;
        [changedProps addObject:@"enablePortraitEffectsMatteDelivery"];
    }
    if(_view.photo != [NSNumber numberWithBool:newViewProps.photo]){
        _view.photo = [NSNumber numberWithBool:newViewProps.photo];
        [changedProps addObject:@"photo"];
    }
    if(_view.video != [NSNumber numberWithBool:newViewProps.video]){
        _view.video = [NSNumber numberWithBool:newViewProps.video];
        [changedProps addObject:@"video"];
    }
    if(_view.audio != [NSNumber numberWithBool:newViewProps.audio]){
        _view.audio = [NSNumber numberWithBool:newViewProps.audio];
        [changedProps addObject:@"audio"];
    }
    if(_view.enableFrameProcessor != newViewProps.enableFrameProcessor){
        _view.enableFrameProcessor = newViewProps.enableFrameProcessor;
        [changedProps addObject:@"enableFrameProcessor"];
    }

    if(_view.fps != [NSNumber numberWithInt:newViewProps.fps]){
        _view.fps = [NSNumber numberWithInt:newViewProps.fps];
        [changedProps addObject:@"fps"];
    }
    if(_view.frameProcessorFps != [NSNumber numberWithInt:newViewProps.frameProcessorFps]){
        _view.frameProcessorFps = [NSNumber numberWithInt:newViewProps.frameProcessorFps];
        [changedProps addObject:@"frameProcessorFps"];
    }
    if(_view.hdr != [NSNumber numberWithInt:newViewProps.hdr]){
        _view.hdr = [NSNumber numberWithInt:newViewProps.hdr];
        [changedProps addObject:@"hdr"];
    }
    if(_view.lowLightBoost != [NSNumber numberWithInt:newViewProps.lowLightBoost]){
        _view.lowLightBoost = [NSNumber numberWithInt:newViewProps.lowLightBoost];
        [changedProps addObject:@"lowLightBoost"];
    }
    if(_view.colorSpace != RCTNSStringFromString(newViewProps.colorSpace) && RCTNSStringFromString(newViewProps.colorSpace).length > 0){
        _view.colorSpace = RCTNSStringFromString(newViewProps.colorSpace);
        [changedProps addObject:@"colorSpace"];
    }
    if(_view.videoStabilizationMode != RCTNSStringFromString(newViewProps.videoStabilizationMode) && RCTNSStringFromString(newViewProps.videoStabilizationMode).length > 0){
        _view.videoStabilizationMode = RCTNSStringFromString(newViewProps.videoStabilizationMode);
        [changedProps addObject:@"videoStabilizationMode"];
    }
    
    if(_view.preset != RCTNSStringFromString(newViewProps.preset) && RCTNSStringFromString(newViewProps.preset).length > 0){ // Empty preset string breaks starting of the session
        _view.preset = RCTNSStringFromString(newViewProps.preset);
        [changedProps addObject:@"preset"];
    }

    if(_view.torch != RCTNSStringFromString(newViewProps.torch) && RCTNSStringFromString(newViewProps.torch).length > 0){
        _view.torch = RCTNSStringFromString(newViewProps.torch);
        [changedProps addObject:@"torch"];
    }

    if(_view.orientation != RCTNSStringFromString(newViewProps.orientation) && RCTNSStringFromString(newViewProps.orientation).length > 0){
        _view.orientation = RCTNSStringFromString(newViewProps.orientation);
        [changedProps addObject:@"orientation"];
    }
    
    if(_view.zoom != [NSNumber numberWithDouble:newViewProps.zoom]){
        _view.zoom = [NSNumber numberWithDouble:newViewProps.zoom];
        [changedProps addObject:@"zoom"];
    }
    
    if(_view.enableZoomGesture != newViewProps.enableZoomGesture){
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
    if([_view.format valueForKey:@"autoFocusSystem"] != RCTNSStringFromString(newViewProps.format.autoFocusSystem)){
        [_view.format setValue:RCTNSStringFromString(newViewProps.format.autoFocusSystem) forKey:@"autoFocusSystem"];
        [changedProps addObject:@"format"];
    }
    if([_view.format valueForKey:@"pixelFormat"] != RCTNSStringFromString(newViewProps.format.pixelFormat)){
        [_view.format setValue:RCTNSStringFromString(newViewProps.format.pixelFormat) forKey:@"pixelFormat"];
        [changedProps addObject:@"format"];
    }
    
    
    if(oldViewProps.format.videoStabilizationModes.size() != newViewProps.format.videoStabilizationModes.size()){
        NSMutableArray* newVideoStabilizationModes = [[NSMutableArray alloc] init];
        for(int i = 0; i < newViewProps.format.videoStabilizationModes.size(); i++){
            [newVideoStabilizationModes addObject:RCTNSStringFromString(newViewProps.format.videoStabilizationModes.at(i))];
        }
        [_view.format setValue:newVideoStabilizationModes forKey:@"videoStabilizationModes"];
        [changedProps addObject:@"format"];
    }
    
    if(oldViewProps.format.colorSpaces.size() != newViewProps.format.colorSpaces.size()){
        NSMutableArray* newColorSpaces = [[NSMutableArray alloc] init];
        for(int i = 0; i < newViewProps.format.colorSpaces.size(); i++){
            [newColorSpaces addObject:RCTNSStringFromString(newViewProps.format.colorSpaces.at(i))];
        }
        [_view.format setValue:newColorSpaces forKey:@"colorSpaces"];
        [changedProps addObject:@"format"];
    }
    
    if(oldViewProps.format.frameRateRanges.size() != newViewProps.format.frameRateRanges.size()){
        NSMutableArray* newFrameRateRanges = [[NSMutableArray alloc] init];
        for(int i = 0; i < newViewProps.format.frameRateRanges.size(); i++){
            [newFrameRateRanges addObject:@{@"minFrameRate": [NSNumber numberWithInt:newViewProps.format.frameRateRanges.at(i).minFrameRate], @"maxFrameRate": [NSNumber numberWithInt:newViewProps.format.frameRateRanges.at(i).maxFrameRate]}];
        }
        [_view.format setValue:newFrameRateRanges forKey:@"frameRateRanges"];
        [changedProps addObject:@"format"];
    }
    
    if([_view.format valueForKey:@"photoHeight"] != [NSNumber numberWithDouble:newViewProps.format.photoHeight]){
        [_view.format setValue:[NSNumber numberWithDouble:newViewProps.format.photoHeight] forKey:@"photoHeight"];
        [changedProps addObject:@"format"];
    }
    if([_view.format valueForKey:@"photoWidth"] != [NSNumber numberWithDouble:newViewProps.format.photoWidth]){
        [_view.format setValue:[NSNumber numberWithDouble:newViewProps.format.photoWidth] forKey:@"photoWidth"];
        [changedProps addObject:@"format"];
    }
    if([_view.format valueForKey:@"videoHeight"] != [NSNumber numberWithDouble:newViewProps.format.videoHeight]){
        [_view.format setValue:[NSNumber numberWithDouble:newViewProps.format.videoHeight] forKey:@"videoHeight"];
        [changedProps addObject:@"format"];
    }
    if([_view.format valueForKey:@"videoWidth"] != [NSNumber numberWithDouble:newViewProps.format.videoWidth]){
        [_view.format setValue:[NSNumber numberWithDouble:newViewProps.format.videoWidth] forKey:@"videoWidth"];
        [changedProps addObject:@"format"];
    }
    if([_view.format valueForKey:@"maxISO"] != [NSNumber numberWithDouble:newViewProps.format.maxISO]){
        [_view.format setValue:[NSNumber numberWithDouble:newViewProps.format.maxISO] forKey:@"maxISO"];
        [changedProps addObject:@"format"];
    }
    if([_view.format valueForKey:@"minISO"] != [NSNumber numberWithDouble:newViewProps.format.minISO]){
        [_view.format setValue:[NSNumber numberWithDouble:newViewProps.format.minISO] forKey:@"minISO"];
        [changedProps addObject:@"format"];
    }
    if([_view.format valueForKey:@"fieldOfView"] != [NSNumber numberWithDouble:newViewProps.format.fieldOfView]){
        [_view.format setValue:[NSNumber numberWithDouble:newViewProps.format.fieldOfView] forKey:@"fieldOfView"];
        [changedProps addObject:@"format"];
    }
    if([_view.format valueForKey:@"maxZoom"] != [NSNumber numberWithDouble:newViewProps.format.maxZoom]){
        [_view.format setValue:[NSNumber numberWithDouble:newViewProps.format.maxZoom] forKey:@"maxZoom"];
        [changedProps addObject:@"format"];
    }
    NSNumber* isHighestPhotoQualitySupported = newViewProps.format.isHighestPhotoQualitySupported ? @1 : @0;
    if([_view.format valueForKey:@"isHighestPhotoQualitySupported"] != isHighestPhotoQualitySupported){
        [_view.format setValue:isHighestPhotoQualitySupported forKey:@"isHighestPhotoQualitySupported"];
        [changedProps addObject:@"format"];
    }
    NSNumber* supportsVideoHDR = newViewProps.format.supportsVideoHDR ? @1 : @0;
    if([_view.format valueForKey:@"supportsVideoHDR"] != supportsVideoHDR){
        [_view.format setValue:supportsVideoHDR forKey:@"supportsVideoHDR"];
        [changedProps addObject:@"format"];
    }
    NSNumber* supportsPhotoHDR = newViewProps.format.supportsPhotoHDR ? @1 : @0;
    if([_view.format valueForKey:@"supportsPhotoHDR"] != supportsPhotoHDR){
        [_view.format setValue:supportsPhotoHDR forKey:@"supportsPhotoHDR"];
        [changedProps addObject:@"format"];
    }
    
    
//    if([_view.format valueForKey:@"autoFocusSystem"] != RCTNSStringFromString(newViewProps.format.autoFocusSystem)){
//        [_view.format setValue:RCTNSStringFromString(newViewProps.format.autoFocusSystem) forKey:@"autoFocusSystem"];
//        [changedProps addObject:@"format"];
//    }

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

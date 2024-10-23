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
#import <React/RCTConversions.h>

#import <AVFoundation/AVFoundation.h>
#if __has_include(<VisionCamera/VisionCamera-Swift.h>)
#import <VisionCamera/VisionCamera-Swift.h>
#else
#import "VisionCamera-Swift.h"
#endif

using namespace facebook::react;

@interface CameraViewNativeComponent () <RCTCameraViewViewProtocol, CameraViewDirectEventDelegate>
@end

@implementation CameraViewNativeComponent {
  CameraView* _view;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<CameraViewComponentDescriptor>();
}

- (void)initCamera {
  static const auto defaultProps = std::make_shared<const CameraViewProps>();
  _props = defaultProps;

  _view = [[CameraView alloc] init];
  _view.eventDelegate = self;

  self.contentView = _view;
}

- (instancetype)initWithFrame:(CGRect)frame {
  self = [super initWithFrame:frame];
  if (self) {
    [self initCamera];
  }

  return self;
}

- (void)updateProps:(const facebook::react::Props::Shared&)props oldProps:(const facebook::react::Props::Shared&)oldProps {
  const auto& newViewProps = *std::static_pointer_cast<CameraViewProps const>(props);
  const auto& oldViewProps = *std::static_pointer_cast<CameraViewProps const>(_props);

  NSMutableArray* changedProps = [[NSMutableArray alloc] init];

  if (oldViewProps.isActive != newViewProps.isActive) {
    _view.isActive = newViewProps.isActive;
    [changedProps addObject:@"isActive"];
  }
  if (oldViewProps.cameraId != newViewProps.cameraId) {
    _view.cameraId = RCTNSStringFromString(newViewProps.cameraId);
    [changedProps addObject:@"cameraId"];
  }
  if (oldViewProps.photoQualityBalance != newViewProps.photoQualityBalance) {
    std::string value = toString(newViewProps.photoQualityBalance);
    _view.photoQualityBalance = RCTNSStringFromString(value);
    [changedProps addObject:@"photoQualityBalance"];
  }
  if (oldViewProps.enableDepthData != newViewProps.enableDepthData) {
    _view.enableDepthData = newViewProps.enableDepthData;
    [changedProps addObject:@"enableDepthData"];
  }
  if (oldViewProps.enablePortraitEffectsMatteDelivery != newViewProps.enablePortraitEffectsMatteDelivery) {
    _view.enablePortraitEffectsMatteDelivery = newViewProps.enablePortraitEffectsMatteDelivery;
    [changedProps addObject:@"enablePortraitEffectsMatteDelivery"];
  }
  if (oldViewProps.photo != newViewProps.photo) {
    _view.photo = [NSNumber numberWithBool:newViewProps.photo];
    [changedProps addObject:@"photo"];
  }
  if (oldViewProps.video != newViewProps.video) {
    _view.video = [NSNumber numberWithBool:newViewProps.video];
    [changedProps addObject:@"video"];
  }
  if (oldViewProps.audio != newViewProps.audio) {
    _view.audio = [NSNumber numberWithBool:newViewProps.audio];
    [changedProps addObject:@"audio"];
  }
  if (oldViewProps.enableFrameProcessor != newViewProps.enableFrameProcessor) {
    _view.enableFrameProcessor = newViewProps.enableFrameProcessor;
    [changedProps addObject:@"enableFrameProcessor"];
  }
  if (oldViewProps.enableLocation != newViewProps.enableLocation) {
    _view.enableLocation = newViewProps.enableLocation;
    [changedProps addObject:@"enableLocation"];
  }
  if (oldViewProps.enableBufferCompression != newViewProps.enableBufferCompression) {
    _view.enableBufferCompression = newViewProps.enableBufferCompression;
    [changedProps addObject:@"enableBufferCompression"];
  }
  if (oldViewProps.videoHdr != newViewProps.videoHdr) {
    _view.videoHdr = newViewProps.videoHdr;
    [changedProps addObject:@"videoHdr"];
  }
  if (oldViewProps.photoHdr != newViewProps.photoHdr) {
    _view.photoHdr = newViewProps.photoHdr;
    [changedProps addObject:@"photoHdr"];
  }
  if (oldViewProps.lowLightBoost != newViewProps.lowLightBoost) {
    _view.lowLightBoost = newViewProps.lowLightBoost;
    [changedProps addObject:@"lowLightBoost"];
  }
  if (oldViewProps.videoStabilizationMode != newViewProps.videoStabilizationMode) {
    std::string value = toString(newViewProps.videoStabilizationMode);
    _view.videoStabilizationMode = RCTNSStringFromString(value);
    [changedProps addObject:@"videoStabilizationMode"];
  }
  if (oldViewProps.torch != newViewProps.torch) {
    std::string value = toString(newViewProps.torch);
    _view.torch = RCTNSStringFromString(value);
    [changedProps addObject:@"torch"];
  }
  if (oldViewProps.resizeMode != newViewProps.resizeMode) {
    std::string value = toString(newViewProps.resizeMode);
    _view.resizeMode = RCTNSStringFromString(value);
    [changedProps addObject:@"resizeMode"];
  }
  if (oldViewProps.pixelFormat != newViewProps.pixelFormat) {
    std::string value = toString(newViewProps.pixelFormat);
    _view.pixelFormat = RCTNSStringFromString(value);
    [changedProps addObject:@"pixelFormat"];
  }
  if (oldViewProps.zoom != newViewProps.zoom) {
    _view.zoom = [NSNumber numberWithDouble:newViewProps.zoom];
    [changedProps addObject:@"zoom"];
  }
  if (oldViewProps.exposure != newViewProps.exposure) {
    _view.exposure = [NSNumber numberWithDouble:newViewProps.exposure];
    [changedProps addObject:@"exposure"];
  }
  if (oldViewProps.enableZoomGesture != newViewProps.enableZoomGesture) {
    _view.enableZoomGesture = newViewProps.enableZoomGesture;
    [changedProps addObject:@"enableZoomGesture"];
  }
  //    if(oldViewProps.enableFpsGraph != newViewProps.enableFpsGraph){
  //        _view.enableFpsGraph = newViewProps.enableFpsGraph;
  //        [changedProps addObject:@"enableFpsGraph"];
  //    }

  // Checking format prop
  bool hasFormatPropChanged = [self hasFormatPropChanged:oldViewProps newViewProps:newViewProps];
  if (hasFormatPropChanged) {
    NSDictionary* format = [self formatDictionaryFromProps:newViewProps];
    _view.format = format;
    [changedProps addObject:@"format"];
  } else {
    //    TODO: in the patch was this but i am not sure if its actually needed...
    //    _view.format = nil;
  }

  if (changedProps.count > 0) {
    [_view didSetProps:changedProps];
  }

  [super updateProps:props oldProps:oldProps];
}

- (NSDictionary*)formatDictionaryFromProps:(const CameraViewProps&)props {
  NSDictionary* format = [[NSMutableDictionary alloc] init];
  const CameraViewFormatStruct& formatProp = props.format;
  [format setValue:[NSNumber numberWithDouble:formatProp.photoHeight] forKey:@"photoHeight"];
  [format setValue:[NSNumber numberWithDouble:formatProp.photoWidth] forKey:@"photoWidth"];
  [format setValue:[NSNumber numberWithDouble:formatProp.videoHeight] forKey:@"videoHeight"];
  [format setValue:[NSNumber numberWithDouble:formatProp.videoWidth] forKey:@"videoWidth"];
  [format setValue:[NSNumber numberWithDouble:formatProp.maxISO] forKey:@"maxISO"];
  [format setValue:[NSNumber numberWithDouble:formatProp.minISO] forKey:@"minISO"];
  [format setValue:[NSNumber numberWithDouble:formatProp.fieldOfView] forKey:@"fieldOfView"];

  NSNumber* supportsVideoHDR = formatProp.supportsVideoHdr ? @1 : @0;
  [format setValue:supportsVideoHDR forKey:@"supportsVideoHdr"];

  NSNumber* supportsPhotoHDR = formatProp.supportsPhotoHdr ? @1 : @0;
  [format setValue:supportsPhotoHDR forKey:@"supportsPhotoHdr"];

  NSNumber* supportsDepthCapture = formatProp.supportsDepthCapture ? @1 : @0;
  [format setValue:supportsDepthCapture forKey:@"supportsDepthCapture"];

  [format setValue:[NSNumber numberWithDouble:formatProp.minFps] forKey:@"minFps"];

  [format setValue:[NSNumber numberWithDouble:formatProp.maxFps] forKey:@"maxFps"];

  [format setValue:RCTNSStringFromString(formatProp.autoFocusSystem) forKey:@"autoFocusSystem"];

  NSMutableArray* newVideoStabilizationModes = [[NSMutableArray alloc] init];
  for (int i = 0; i < formatProp.videoStabilizationModes.size(); i++) {
    [newVideoStabilizationModes addObject:RCTNSStringFromString(formatProp.videoStabilizationModes.at(i))];
  }
  [format setValue:newVideoStabilizationModes forKey:@"videoStabilizationModes"];

  return format;
}

- (bool)hasFormatPropChanged:(const CameraViewProps&)oldViewProps newViewProps:(const CameraViewProps&)newViewProps {
  return oldViewProps.format.photoHeight != newViewProps.format.photoHeight ||
         oldViewProps.format.photoWidth != newViewProps.format.photoWidth ||
         oldViewProps.format.videoHeight != newViewProps.format.videoHeight ||
         oldViewProps.format.videoWidth != newViewProps.format.videoWidth || oldViewProps.format.maxISO != newViewProps.format.maxISO ||
         oldViewProps.format.minISO != newViewProps.format.minISO || oldViewProps.format.fieldOfView != newViewProps.format.fieldOfView ||
         oldViewProps.format.supportsVideoHdr != newViewProps.format.supportsVideoHdr ||
         oldViewProps.format.supportsPhotoHdr != newViewProps.format.supportsPhotoHdr ||
         oldViewProps.format.supportsDepthCapture != newViewProps.format.supportsDepthCapture ||
         oldViewProps.format.minFps != newViewProps.format.minFps || oldViewProps.format.maxFps != newViewProps.format.maxFps ||
         oldViewProps.format.autoFocusSystem != newViewProps.format.autoFocusSystem ||
         oldViewProps.format.videoStabilizationModes.size() != newViewProps.format.videoStabilizationModes.size();
}

// MARK: Event emitter functions

- (void)emitOnAverageFpsChangedEvent:(NSDictionary<NSString*, id>* _Nonnull)message {
  if (!_eventEmitter) {
    return;
  }

  std::shared_ptr<const CameraViewEventEmitter> emitter = std::static_pointer_cast<const CameraViewEventEmitter>(_eventEmitter);

  CameraViewEventEmitter::OnAverageFpsChanged payload = {.averageFps = [[message objectForKey:@"averageFps"] doubleValue]};

  emitter->onAverageFpsChanged(payload);
}

- (void)emitOnCodeScannedEvent:(NSDictionary<NSString*, id>* _Nonnull)message {
  if (!_eventEmitter) {
    return;
  }

  std::shared_ptr<const CameraViewEventEmitter> emitter = std::static_pointer_cast<const CameraViewEventEmitter>(_eventEmitter);

  // TODO: implement
}

- (void)emitOnErrorEvent:(NSDictionary<NSString*, id>* _Nonnull)error {
  // TODO: implement
}

- (void)emitOnInitializedEvent {
  if (!_eventEmitter) {
    return;
  }

  std::shared_ptr<const CameraViewEventEmitter> emitter = std::static_pointer_cast<const CameraViewEventEmitter>(_eventEmitter);

  emitter->onInitialized({});
}

- (void)emitOnOutputOrientationChangedEvent:(NSDictionary<NSString*, id>* _Nonnull)message {
  // TODO: implement
}

- (void)emitOnPreviewOrientationChangedEvent:(NSDictionary<NSString*, id>* _Nonnull)message {
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

- (void)emitOnShutterEvent:(NSDictionary<NSString*, id>* _Nonnull)message {
  if (!_eventEmitter) {
    return;
  }

  std::shared_ptr<const CameraViewEventEmitter> emitter = std::static_pointer_cast<const CameraViewEventEmitter>(_eventEmitter);

  CameraViewEventEmitter::OnShutter payload = {.type = std::string([[message objectForKey:@"type"] UTF8String])};
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

Class<RCTComponentViewProtocol> CameraViewCls(void) {
  return CameraViewNativeComponent.class;
}

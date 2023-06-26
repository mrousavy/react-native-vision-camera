#ifdef RCT_NEW_ARCH_ENABLED
#import "CameraModule.h"


@implementation CameraModule
static CameraView* cameraView;

RCT_EXPORT_MODULE()

+(void) setCurrentCamera:(CameraView*)view{
    cameraView = view;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
    NSLog(@"TESTING GET TURBO MODULES");
    return std::make_shared<facebook::react::NativeCameraModuleSpecJSI>(params);
}

- (void)focus:(JS::NativeCameraModule::SpecFocusPoint &)point resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    if(cameraView != nil){
        
    }
}

//- (void)getAvailableCameraDevices:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
//    NSLog(@"TESTING GET DEVICES");
//        CameraViewManager* cameraManager = [CameraViewManager init];
//        [cameraManager getAvailableCameraDevices:resolve reject:reject];
//
//}

- (void)getAvailableVideoCodecs:(NSString *)fileType resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    
}

//- (void)getCameraPermissionStatus:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
//
//}

- (void)getMicrophonePermissionStatus:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    
}

- (void)pauseRecording:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    
}

- (void)requestCameraPermission:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    
}

- (void)requestMicrophonePermission:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    
}

- (void)resumeRecording:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    
}

- (void)startRecording:(JS::NativeCameraModule::SpecStartRecordingOptions &)options onRecordCallback:(RCTResponseSenderBlock)onRecordCallback {
    
}

- (void)stopRecording:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    
}

- (void)takePhoto:(JS::NativeCameraModule::SpecTakePhotoOptions &)options resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    
}

- (void)takeSnapshot:(JS::NativeCameraModule::SpecTakeSnapshotOptions &)options resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    
}

//RCT_EXPORT_METHOD(getString:(NSString *)string
//                   callback:(RCTResponseSenderBlock)callback)
//{
//  // Implement this method
//}

RCT_EXPORT_METHOD(getCameraPermissionStatus:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject){
    
}

RCT_EXPORT_METHOD(getAvailableCameraDevices:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject){
    NSLog(@"TESTING GET DEVICES");
        CameraViewManager* cameraManager = [CameraViewManager init];
        [cameraManager getAvailableCameraDevices:resolve reject:reject];
}

@end
#endif

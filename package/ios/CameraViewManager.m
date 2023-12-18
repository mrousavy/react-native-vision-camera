//
//  CameraViewManager.m
//  mrousavy
//
//  Created by Marc Rousavy on 09.11.20.
//  Copyright © 2020 mrousavy. All rights reserved.
//

#import <Foundation/Foundation.h>

#import <React/RCTUtils.h>
#import <React/RCTViewManager.h>

@interface RCT_EXTERN_REMAP_MODULE (CameraView, CameraViewManager, RCTViewManager)

// Module Functions
RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(getCameraPermissionStatus);
RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(getMicrophonePermissionStatus);
RCT_EXTERN_METHOD(requestCameraPermission : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject);
RCT_EXTERN_METHOD(requestMicrophonePermission : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject);

RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(installFrameProcessorBindings);

// Camera View Properties
RCT_EXPORT_VIEW_PROPERTY(isActive, BOOL);
RCT_EXPORT_VIEW_PROPERTY(cameraId, NSString);
RCT_EXPORT_VIEW_PROPERTY(enableDepthData, BOOL);
RCT_EXPORT_VIEW_PROPERTY(enableHighQualityPhotos, BOOL);
RCT_EXPORT_VIEW_PROPERTY(enablePortraitEffectsMatteDelivery, BOOL);
RCT_EXPORT_VIEW_PROPERTY(enableBufferCompression, BOOL);
// use cases
RCT_EXPORT_VIEW_PROPERTY(photo, BOOL);
RCT_EXPORT_VIEW_PROPERTY(video, BOOL);
RCT_EXPORT_VIEW_PROPERTY(audio, BOOL);
RCT_EXPORT_VIEW_PROPERTY(enableFrameProcessor, BOOL);
// device format
RCT_EXPORT_VIEW_PROPERTY(format, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(fps, NSNumber);
RCT_EXPORT_VIEW_PROPERTY(videoHdr, BOOL);
RCT_EXPORT_VIEW_PROPERTY(photoHdr, BOOL);
RCT_EXPORT_VIEW_PROPERTY(lowLightBoost, BOOL);
RCT_EXPORT_VIEW_PROPERTY(videoStabilizationMode, NSString);
RCT_EXPORT_VIEW_PROPERTY(pixelFormat, NSString);
// other props
RCT_EXPORT_VIEW_PROPERTY(torch, NSString);
RCT_EXPORT_VIEW_PROPERTY(zoom, NSNumber);
RCT_EXPORT_VIEW_PROPERTY(exposure, NSNumber);
RCT_EXPORT_VIEW_PROPERTY(enableZoomGesture, BOOL);
RCT_EXPORT_VIEW_PROPERTY(enableFpsGraph, BOOL);
RCT_EXPORT_VIEW_PROPERTY(orientation, NSString);
RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString);
// Camera View Events
RCT_EXPORT_VIEW_PROPERTY(onError, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onInitialized, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onStarted, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onStopped, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onViewReady, RCTDirectEventBlock);
// Code Scanner
RCT_EXPORT_VIEW_PROPERTY(codeScannerOptions, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(onCodeScanned, RCTDirectEventBlock);

// Camera View Functions
RCT_EXTERN_METHOD(startRecording
                  : (nonnull NSNumber*)node options
                  : (NSDictionary*)options onRecordCallback
                  : (RCTResponseSenderBlock)onRecordCallback);
RCT_EXTERN_METHOD(pauseRecording
                  : (nonnull NSNumber*)node resolve
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject);
RCT_EXTERN_METHOD(resumeRecording
                  : (nonnull NSNumber*)node resolve
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject);
RCT_EXTERN_METHOD(stopRecording : (nonnull NSNumber*)node resolve : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject);
RCT_EXTERN_METHOD(takePhoto
                  : (nonnull NSNumber*)node options
                  : (NSDictionary*)options resolve
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject);
RCT_EXTERN_METHOD(focus
                  : (nonnull NSNumber*)node point
                  : (NSDictionary*)point resolve
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject);

@end

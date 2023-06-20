package com.mrousavy.camera;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.module.annotations.ReactModule;

import java.util.concurrent.ExecutorService;

@ReactModule(name = "CameraModule")
public class CameraModule extends NativeCameraModuleSpec {
    private final CameraViewModule cameraViewModule;

    public CameraView getViewInstance() {
        return viewInstance;
    }

    public void setViewInstance(CameraView viewInstance) {
        this.viewInstance = viewInstance;
    }

    private CameraView viewInstance;
    public CameraModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.cameraViewModule = new CameraViewModule(reactContext);
    }

    @Override
    public void takePhoto(@Nullable ReadableMap options, Promise promise) {
        cameraViewModule.takePhoto(viewInstance, options, promise);
    }

    @Override
    public void takeSnapshot(@Nullable ReadableMap options, Promise promise) {
        cameraViewModule.takeSnapshot(viewInstance, options, promise);
    }

    @Override
    public void startRecording(@Nullable ReadableMap options, @Nullable Callback onRecordCallback) {
        cameraViewModule.startRecording(viewInstance, options, onRecordCallback);
    }

    @Override
    public void pauseRecording(Promise promise) {
        cameraViewModule.pauseRecording(viewInstance, promise);
    }

    @Override
    public void resumeRecording(Promise promise) {
        cameraViewModule.resumeRecording(viewInstance, promise);
    }

    @Override
    public void stopRecording(Promise promise) {
        cameraViewModule.stopRecording(viewInstance, promise);
    }

    @Override
    public void focus(ReadableMap point, Promise promise) {
        cameraViewModule.focus(viewInstance, point, promise);
    }

    @Override
    public void getAvailableVideoCodecs(@Nullable String fileType, Promise promise) {
        // IOS only
    }

    @Override
    public void getAvailableCameraDevices(Promise promise) {
        cameraViewModule.getAvailableCameraDevices(promise);
    }

    @Override
    public void getCameraPermissionStatus(Promise promise) {
        cameraViewModule.getCameraPermissionStatus(promise);
    }

    @Override
    public void getMicrophonePermissionStatus(Promise promise) {
        cameraViewModule.getMicrophonePermissionStatus(promise);
    }

    @Override
    public void requestCameraPermission(Promise promise) {
        cameraViewModule.requestCameraPermission(promise);
    }

    @Override
    public void requestMicrophonePermission(Promise promise) {
        cameraViewModule.requestMicrophonePermission(promise);
    }

    public ExecutorService getFrameProcessorThread(){
        return cameraViewModule.getFrameProcessorThread();
    }
}

package com.mrousavy.camera;

import android.view.View;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.viewmanagers.CameraViewManagerDelegate;
import com.facebook.react.viewmanagers.CameraViewManagerInterface;

public abstract class VisionCameraManagerSpec<T extends View> extends SimpleViewManager<T> implements CameraViewManagerInterface<T> {
  private final ViewManagerDelegate<T> mDelegate;

  public VisionCameraManagerSpec() {
    mDelegate = new CameraViewManagerDelegate<>(this);
  }

  @Nullable
  @Override
  protected ViewManagerDelegate<T> getDelegate() {
    return mDelegate;
  }

  @Override
  public void receiveCommand(@NonNull T root, String commandId, @Nullable ReadableArray args) {
    mDelegate.receiveCommand(root, commandId, args);
  }
}
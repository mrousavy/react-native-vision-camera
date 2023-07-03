package com.mrousavy.camera.frameprocessor;

import androidx.annotation.Keep;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.camera.core.ImageProxy;
import com.facebook.proguard.annotations.DoNotStrip;

/**
 * Represents a Frame from the Camera.
 */
@DoNotStrip
@Keep
public class Frame {
  private ImageProxy _imageProxy;

  Frame(ImageProxy imageProxy) {
    _imageProxy = imageProxy;
  }

  @Keep
  public int getWidth() {
    return _imageProxy.getWidth();
  }
}

package com.mrousavy.camera.frameprocessor;

import android.annotation.SuppressLint;
import android.graphics.ImageFormat;
import android.media.Image;
import androidx.annotation.Keep;
import androidx.annotation.NonNull;
import androidx.camera.core.ImageProxy;

import com.facebook.proguard.annotations.DoNotStrip;
import java.nio.ByteBuffer;

/**
 * Represents a Frame from the Camera.
 */
@DoNotStrip
@Keep
public class Frame {
  private final ImageProxy imageProxy;
  private final Orientation orientation;
  private final boolean isMirrored;
  private final long timestamp;
  private static byte[] byteArrayCache;

  public Frame(ImageProxy imageProxy, Orientation orientation, boolean isMirrored, long timestamp) {
    this.imageProxy = imageProxy;
    this.orientation = orientation;
    this.isMirrored = isMirrored;
    this.timestamp = timestamp;
  }

  @DoNotStrip
  @Keep
  public int getWidth() {
    return imageProxy.getWidth();
  }

  @DoNotStrip
  @Keep
  public int getHeight() {
    return imageProxy.getHeight();
  }

  @DoNotStrip
  @Keep
  public void close() {
    imageProxy.close();
  }

  @DoNotStrip
  @Keep
  public String getOrientation() {
    return orientation.toString();
  }

  @SuppressLint("UnsafeOptInUsageError")
  @DoNotStrip
  @Keep
  public Image getImage() {
    return imageProxy.getImage();
  }

  @SuppressLint("UnsafeOptInUsageError")
  @DoNotStrip
  @Keep
  public ImageProxy getImageProxy() {
    return imageProxy;
  }

  @DoNotStrip
  @Keep
  public boolean getIsMirrored() {
    return isMirrored;
  }

  @DoNotStrip
  @Keep
  public long getTimestamp() {
    return timestamp;
  }

  @DoNotStrip
  @Keep
  public boolean getIsValid() {
    try {
      // will throw an exception if the image is already closed
      imageProxy.getCropRect();
      // no exception thrown, image must still be valid.
      return true;
    } catch (Exception e) {
      // exception thrown, image has already been closed.
      return false;
    }
  }

  @DoNotStrip
  @Keep
  public int getPlanesCount() {
    return imageProxy.getPlanes().length;
  }

  @DoNotStrip
  @Keep
  public int getBytesPerRow() {
    return imageProxy.getPlanes()[0].getRowStride();
  }

  @DoNotStrip
  @Keep
  public byte[] toByteArray() {
    switch (imageProxy.getFormat()) {
      case ImageFormat.YUV_420_888:
        ByteBuffer yBuffer = imageProxy.getPlanes()[0].getBuffer();
        ByteBuffer vuBuffer = imageProxy.getPlanes()[2].getBuffer();
        int ySize = yBuffer.remaining();
        int vuSize = vuBuffer.remaining();

        if (byteArrayCache == null || byteArrayCache.length != ySize + vuSize) {
          byteArrayCache = new byte[ySize + vuSize];
        }

        yBuffer.get(byteArrayCache, 0, ySize);
        vuBuffer.get(byteArrayCache, ySize, vuSize);

        return byteArrayCache;
      default:
        throw new RuntimeException("Cannot convert Frame with Format " + imageProxy.getFormat() + " to byte array!");
    }
  }


  public enum Orientation {
    PORTRAIT, PORTRAIT_UPSIDE_DOWN, LANDSCAPE_LEFT, LANDSCAPE_RIGHT;

    @NonNull
    @Override
    public String toString() {
      switch (this) {
        case PORTRAIT: return "portrait";
        case PORTRAIT_UPSIDE_DOWN: return "portraitUpsideDown";
        case LANDSCAPE_LEFT: return "landscapeLeft";
        case LANDSCAPE_RIGHT: return "landscapeRight";
        default: throw new Error("Unknown Value for Orientation!");
      }
    }
  }
}
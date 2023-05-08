package com.mrousavy.camera.frameprocessor;

import android.graphics.ImageFormat;
import android.media.Image;

import androidx.annotation.Keep;
import androidx.annotation.NonNull;

import com.facebook.proguard.annotations.DoNotStrip;

import java.nio.ByteBuffer;

@DoNotStrip
@Keep
public class Frame {
  private final Image image;
  private final Orientation orientation;
  private final boolean isMirrored;
  private final long timestamp;
  private static byte[] byteArrayCache;

  public Frame(Image image, Orientation orientation, boolean isMirrored, long timestamp) {
    this.image = image;
    this.orientation = orientation;
    this.isMirrored = isMirrored;
    this.timestamp = timestamp;
  }

  @DoNotStrip
  @Keep
  public int getWidth() {
    return image.getWidth();
  }

  @DoNotStrip
  @Keep
  public int getHeight() {
    return image.getHeight();
  }

  @DoNotStrip
  @Keep
  public void close() {
    image.close();
  }

  @DoNotStrip
  @Keep
  public String getOrientation() {
    return orientation.toString();
  }

  @DoNotStrip
  @Keep
  public Image getImage() {
    return image;
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
      image.getCropRect();
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
    return image.getPlanes().length;
  }

  @DoNotStrip
  @Keep
  public int getBytesPerRow() {
    return image.getPlanes()[0].getRowStride();
  }

  @DoNotStrip
  @Keep
  public byte[] toByteArray() {
    switch (image.getFormat()) {
      case ImageFormat.YUV_420_888:
        ByteBuffer yBuffer = image.getPlanes()[0].getBuffer();
        ByteBuffer vuBuffer = image.getPlanes()[2].getBuffer();
        int ySize = yBuffer.remaining();
        int vuSize = vuBuffer.remaining();

        if (byteArrayCache == null || byteArrayCache.length != ySize + vuSize) {
          byteArrayCache = new byte[ySize + vuSize];
        }

        yBuffer.get(byteArrayCache, 0, ySize);
        vuBuffer.get(byteArrayCache, ySize, vuSize);

        return byteArrayCache;
      default:
        throw new RuntimeException("Cannot convert Frame with Format " + image.getFormat() + " to byte array!");
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

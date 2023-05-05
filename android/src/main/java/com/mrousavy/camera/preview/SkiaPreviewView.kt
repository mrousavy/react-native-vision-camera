package com.mrousavy.camera.preview

import android.content.Context
import android.view.TextureView
import android.widget.FrameLayout

class SkiaPreviewView(context: Context): FrameLayout(context) {
  val textureView: TextureView

  init {
    textureView = TextureView(context)
    textureView.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
    addView(textureView)
  }

}

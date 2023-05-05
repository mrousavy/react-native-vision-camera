package com.mrousavy.camera.preview

import android.content.Context
import android.graphics.Color
import android.view.TextureView
import android.view.ViewGroup
import com.facebook.react.views.view.ReactViewGroup

class SkiaPreviewView(context: Context): ReactViewGroup(context) {

  val textureView: TextureView

  init {
      textureView = TextureView(context)
      addView(textureView, 0, ViewGroup.LayoutParams.MATCH_PARENT)
  }

}

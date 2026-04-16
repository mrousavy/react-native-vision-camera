package com.margelo.nitro.camera.views

import android.view.SurfaceHolder
import android.view.SurfaceView
import android.view.View
import com.facebook.react.uimanager.ThemedReactContext
import com.margelo.nitro.camera.HybridFrameRendererSpec
import com.margelo.nitro.camera.HybridFrameRendererViewSpec
import com.margelo.nitro.camera.public.NativeFrameRenderer

class HybridFrameRendererView(
  val context: ThemedReactContext,
) : HybridFrameRendererViewSpec(),
  SurfaceHolder.Callback {
  private val surfaceView = SurfaceView(context)
  override val view: View
    get() = surfaceView

  init {
    surfaceView.holder.addCallback(this)
  }

  override var renderer: HybridFrameRendererSpec? = null
    set(value) {
      // Disconnect old Renderer
      val oldRenderer = field as? NativeFrameRenderer
      oldRenderer?.disconnectSurface()

      // Maybe connect new Renderer
      if (surfaceView.holder.surface != null) {
        val newRenderer = value as? NativeFrameRenderer
        newRenderer?.connectSurface(surfaceView.holder.surface)
      }
      field = value
    }

  override fun surfaceChanged(
    surfaceHolder: SurfaceHolder,
    width: Int,
    height: Int,
    format: Int,
  ) {
    val nativeRenderer =
      renderer as? NativeFrameRenderer
        ?: return
    nativeRenderer.connectSurface(surfaceHolder.surface)
  }

  override fun surfaceCreated(surfaceHolder: SurfaceHolder) {
    val nativeRenderer =
      renderer as? NativeFrameRenderer
        ?: return
    nativeRenderer.connectSurface(surfaceHolder.surface)
  }

  override fun surfaceDestroyed(surfaceHolder: SurfaceHolder) {
    val nativeRenderer =
      renderer as? NativeFrameRenderer
        ?: return
    nativeRenderer.disconnectSurface()
  }
}

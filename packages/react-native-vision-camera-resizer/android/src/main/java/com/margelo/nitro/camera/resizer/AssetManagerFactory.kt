package com.margelo.nitro.camera.resizer

import android.content.res.AssetManager
import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.NitroModules

/**
 * Exposes the app AssetManager to native code that loads packaged assets.
 */
@Keep
@DoNotStrip
class AssetManagerFactory private constructor() {
  companion object {
    @Keep
    @DoNotStrip
    @JvmStatic
    fun create(): AssetManager {
      val context =
        NitroModules.applicationContext
          ?: throw IllegalStateException("NitroModules.applicationContext is null. AssetManagerFactory cannot create an AssetManager.")
      return context.assets
    }
  }
}

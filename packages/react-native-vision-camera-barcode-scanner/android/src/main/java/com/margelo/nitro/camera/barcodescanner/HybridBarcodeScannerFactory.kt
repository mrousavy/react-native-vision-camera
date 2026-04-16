package com.margelo.nitro.camera.barcodescanner

import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.camera.HybridCameraOutputSpec

@DoNotStrip
@Keep
class HybridBarcodeScannerFactory : HybridBarcodeScannerFactorySpec() {
  @DoNotStrip
  @Keep
  override fun createBarcodeScanner(options: BarcodeScannerOptions): HybridBarcodeScannerSpec {
    return HybridBarcodeScanner(options)
  }

  @DoNotStrip
  @Keep
  override fun createBarcodeScannerOutput(options: BarcodeScannerOutputOptions): HybridCameraOutputSpec {
    return HybridBarcodeScannerOutput(options)
  }
}

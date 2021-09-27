package com.mrousavy.camera.utils

import android.view.View
import com.facebook.react.uimanager.util.ReactFindViewUtil
import com.mrousavy.camera.ViewNotFoundError
import kotlinx.coroutines.*
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

/**
 * @throws ViewNotFoundError When the View cannot be found after the given timeout.
 */
@OptIn(DelicateCoroutinesApi::class)
suspend fun <TView: View>findViewWithTimeout(rootView: View, nativeId: String, timeoutMillis: Long): TView {
  val view = ReactFindViewUtil.findView(rootView, nativeId)
  if (view != null) {
    return view as TView
  }

  return suspendCoroutine { coroutine ->
    val didReturn = AtomicBoolean(false)

    val listener: ReactFindViewUtil.OnViewFoundListener = object : ReactFindViewUtil.OnViewFoundListener {
      override fun getNativeId(): String = nativeId
      override fun onViewFound(view: View?) {
        if (didReturn.get())
          return

        if (view != null) {
          coroutine.resume(view as TView)
          didReturn.set(true)
        } else {
          coroutine.resumeWithException(ViewNotFoundError(nativeId))
          didReturn.set(true)
        }
      }
    }
    ReactFindViewUtil.findView(rootView, listener)
    GlobalScope.launch {
      withTimeout(timeoutMillis) {
        if (didReturn.get())
          return@withTimeout

        coroutine.resumeWithException(ViewNotFoundError(nativeId))
        didReturn.set(true)
      }
    }
  }
}

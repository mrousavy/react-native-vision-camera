package com.margelo.nitro.camera.utils

import android.util.Log
import androidx.annotation.UiThread
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LifecycleRegistry
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.common.LifecycleState
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * A [LifecycleOwner] that binds to the [context]'s lifecycle and has an additional
 * [isActive] property that pauses or resumes whatever the [context]'s lifecycle is.
 */
class CustomLifecycle(
  private val context: ReactApplicationContext,
) : LifecycleEventListener,
  LifecycleOwner {
  companion object {
    private const val TAG = "CustomLifecycle"
  }

  private val lifecycleRegistry = LifecycleRegistry(this)
  private val uiScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

  @Volatile private var isActive: Boolean = false

  @Volatile private var destroyed = false

  override val lifecycle: Lifecycle
    get() = lifecycleRegistry

  init {
    context.addLifecycleEventListener(this)
    runOnUI {
      moveTo(Lifecycle.State.CREATED)
    }
  }

  private fun runOnUI(closure: () -> Unit) {
    uiScope.launch { closure() }
  }

  fun setActive(active: Boolean) {
    isActive = active
    updateLifecycle()
  }

  fun destroy() {
    destroyed = true
    context.removeLifecycleEventListener(this)
    runOnUI {
      moveTo(Lifecycle.State.DESTROYED)
    }
  }

  override fun onHostResume() {
    updateLifecycle()
  }

  override fun onHostPause() {
    updateLifecycle()
  }

  override fun onHostDestroy() {
    destroy()
  }

  private fun updateLifecycle() {
    runOnUI {
      if (destroyed) return@runOnUI
      val newState =
        when (context.lifecycleState) {
          LifecycleState.BEFORE_CREATE -> Lifecycle.State.INITIALIZED
          LifecycleState.BEFORE_RESUME -> if (isActive) Lifecycle.State.STARTED else Lifecycle.State.CREATED
          LifecycleState.RESUMED -> if (isActive) Lifecycle.State.RESUMED else Lifecycle.State.CREATED
        }
      moveTo(newState)
    }
  }

  @UiThread
  private fun moveTo(state: Lifecycle.State) {
    val current = lifecycleRegistry.currentState
    if (current == state) return
    Log.i(TAG, "Switching lifecycle state from $current to $state...")

    // Move monotonically with events
    when {
      state > current -> {
        if (current < Lifecycle.State.CREATED) lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_CREATE)
        if (state >= Lifecycle.State.STARTED &&
          current < Lifecycle.State.STARTED
        ) {
          lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_START)
        }
        if (state >= Lifecycle.State.RESUMED &&
          current < Lifecycle.State.RESUMED
        ) {
          lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_RESUME)
        }
      }
      else -> {
        if (current >= Lifecycle.State.RESUMED &&
          state < Lifecycle.State.RESUMED
        ) {
          lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_PAUSE)
        }
        if (current >= Lifecycle.State.STARTED &&
          state < Lifecycle.State.STARTED
        ) {
          lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_STOP)
        }
        if (current >= Lifecycle.State.CREATED &&
          state < Lifecycle.State.CREATED
        ) {
          lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_DESTROY)
        }
      }
    }
  }
}

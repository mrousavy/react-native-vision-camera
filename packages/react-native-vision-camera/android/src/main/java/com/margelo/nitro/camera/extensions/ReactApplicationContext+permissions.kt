package com.margelo.nitro.camera.extensions

import android.content.pm.PackageManager
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import com.margelo.nitro.camera.PermissionStatus
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger
import kotlin.coroutines.resume
import kotlinx.coroutines.CancellableContinuation
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext

fun ReactApplicationContext.getPermissionStatus(permission: String): PermissionStatus {
  val status = ContextCompat.checkSelfPermission(this, permission)
  return when (status) {
    PackageManager.PERMISSION_DENIED -> {
      val hasRequestedPermissionBefore = PermissionStateStore.hasRequestedPermission(this, permission)
      if (!hasRequestedPermissionBefore) {
        return PermissionStatus.NOT_DETERMINED
      }
      if (PermissionStateStore.isPermissionPermanentlyDenied(this, permission)) {
        return PermissionStatus.DENIED
      }
      val activity = this.currentActivity
      if (activity != null) {
        val canRequestAgain = ActivityCompat.shouldShowRequestPermissionRationale(activity, permission)
        if (!canRequestAgain) {
          return PermissionStatus.DENIED
        }
      }
      return PermissionStatus.NOT_DETERMINED
    }
    PackageManager.PERMISSION_GRANTED -> {
      PermissionStateStore.setHasRequestedPermission(this, permission, false)
      PermissionStateStore.setPermissionPermanentlyDenied(this, permission, false)
      PermissionStatus.AUTHORIZED
    }
    else -> {
      Log.e("Permissions", "Unknown Permission Status! $status")
      return PermissionStatus.NOT_DETERMINED
    }
  }
}

private object PermissionRequestDispatcher : PermissionListener {
  private val nextRequestCode = AtomicInteger(3682)
  private val pendingRequests = ConcurrentHashMap<Int, PendingPermissionRequest>()

  fun request(
    context: ReactApplicationContext,
    permission: String,
    activity: PermissionAwareActivity,
    continuation: CancellableContinuation<Boolean>,
  ) {
    val requestCode = nextRequestCode.getAndIncrement()
    val hadRequestedPermission = PermissionStateStore.hasRequestedPermission(context, permission)
    pendingRequests[requestCode] = PendingPermissionRequest(context, activity, permission, continuation)
    try {
      PermissionStateStore.setHasRequestedPermission(context, permission, true)
      activity.requestPermissions(arrayOf(permission), requestCode, this)
    } catch (error: Throwable) {
      pendingRequests.remove(requestCode)
      PermissionStateStore.setHasRequestedPermission(context, permission, hadRequestedPermission)
      throw error
    }
  }

  override fun onRequestPermissionsResult(
    requestCode: Int,
    permissions: Array<String>,
    grantResults: IntArray,
  ): Boolean {
    val pendingRequest =
      pendingRequests.remove(requestCode) ?: return pendingRequests.isEmpty()

    val permissionStatus = grantResults.firstOrNull() ?: PackageManager.PERMISSION_DENIED
    val hasPermission = permissionStatus == PackageManager.PERMISSION_GRANTED
    pendingRequest.updatePermissionState(hasPermission)
    if (pendingRequest.continuation.isActive) {
      pendingRequest.continuation.resume(hasPermission)
    }

    // React Native only clears the currently registered PermissionListener if it returns true.
    // Keep the shared listener alive until every pending VisionCamera request has completed.
    return pendingRequests.isEmpty()
  }

  private data class PendingPermissionRequest(
    val context: ReactApplicationContext,
    val activity: PermissionAwareActivity,
    val permission: String,
    val continuation: CancellableContinuation<Boolean>,
  ) {
    fun updatePermissionState(hasPermission: Boolean) {
      if (hasPermission) {
        PermissionStateStore.setHasRequestedPermission(context, permission, false)
        PermissionStateStore.setPermissionPermanentlyDenied(context, permission, false)
      } else {
        val canRequestAgain = activity.shouldShowRequestPermissionRationale(permission)
        PermissionStateStore.setPermissionPermanentlyDenied(context, permission, !canRequestAgain)
      }
    }
  }
}

suspend fun ReactApplicationContext.requestPermission(permission: String): Boolean {
  return withContext(Dispatchers.Main.immediate) {
    suspendCancellableCoroutine { continuation ->
      val activity = currentActivity ?: throw Error("No Activity!")
      if (activity is PermissionAwareActivity) {
        PermissionRequestDispatcher.request(this@requestPermission, permission, activity, continuation)
      } else {
        throw Error("Activity is not a PermissionAwareActivity!")
      }
    }
  }
}

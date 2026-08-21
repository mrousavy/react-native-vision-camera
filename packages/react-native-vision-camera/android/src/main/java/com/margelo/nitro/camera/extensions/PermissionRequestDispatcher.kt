package com.margelo.nitro.camera.extensions

import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import kotlinx.coroutines.CancellableContinuation
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.util.concurrent.ConcurrentHashMap
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * Runs Android runtime permission requests one at a time and routes each result back to the caller that started it.
 *
 * Both React Native and Android only keep track of a single permission request at a time, so requests that overlap lose
 * their results and leave their callers suspended forever:
 * - A [PermissionAwareActivity] only remembers the [PermissionListener] of the most recent request, so a listener created
 *   per request is overwritten before its result arrives. This dispatcher registers one shared listener instead and keeps
 *   the per-request state here, keyed by request code.
 * - `Activity.requestPermissions(...)` refuses a request while another one is still in flight ("Can request only one set of
 *   permissions at a time") and cancels it with empty grant results, which would look like a denial for a permission the
 *   user was never asked about. The [mutex] makes sure Android only ever sees one request at a time.
 */
internal object PermissionRequestDispatcher {
  private val mutex = Mutex()
  private val pendingRequests = ConcurrentHashMap<Int, CancellableContinuation<IntArray>>()
  private var nextRequestCode = 3682

  private val listener =
    PermissionListener { requestCode: Int, _: Array<String>, grantResults: IntArray ->
      val continuation = pendingRequests.remove(requestCode) ?: return@PermissionListener false
      if (continuation.isActive) {
        continuation.resume(grantResults)
      }
      // Returning `true` makes React Native drop the shared listener, so only give the slot up once
      // there is no request left that still needs its result delivered.
      return@PermissionListener pendingRequests.isEmpty()
    }

  /**
   * Requests the given [permission] and suspends until Android reported a result for it.
   * @return The grant results as reported by Android - empty if the request has been cancelled.
   */
  suspend fun request(
    activity: PermissionAwareActivity,
    permission: String,
  ): IntArray =
    mutex.withLock {
      suspendCancellableCoroutine { continuation ->
        val requestCode = nextRequestCode++
        pendingRequests[requestCode] = continuation
        continuation.invokeOnCancellation { pendingRequests.remove(requestCode) }

        try {
          activity.requestPermissions(arrayOf(permission), requestCode, listener)
        } catch (error: Throwable) {
          // Android never received the request, so no result will ever arrive for it.
          pendingRequests.remove(requestCode)?.resumeWithException(error)
        }
      }
    }
}

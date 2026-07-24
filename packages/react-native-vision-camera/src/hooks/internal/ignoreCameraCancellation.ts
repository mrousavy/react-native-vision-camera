/**
 * Ignores routine cancellation rejections from a fire-and-forget
 * {@linkcode CameraController} call (e.g. `setZoom(..)`, `setTorchMode(..)`).
 *
 * On Android, CameraX rejects a pending camera control operation with an
 * `OperationCanceledException` when a newer value supersedes an in-flight one
 * ("Cancelled due to another zoom value being set") or when the camera is not
 * currently active ("Camera is not active"). Those are expected lifecycle
 * events, not errors — but when a hook fires the call without awaiting it,
 * the rejection surfaces as an unhandled promise rejection in the app.
 *
 * Any non-cancellation error is re-thrown so it keeps its previous
 * unhandled-rejection visibility instead of being silently swallowed.
 */
export function ignoreCameraCancellation(promise: Promise<void>): void {
  promise.catch((error: unknown) => {
    const message = String((error as Error | undefined)?.message ?? error)
    const isRoutineCancellation =
      message.includes('OperationCanceled') ||
      message.includes('Camera is not active') ||
      message.includes('Cancelled due to another')
    if (isRoutineCancellation) return
    throw error
  })
}

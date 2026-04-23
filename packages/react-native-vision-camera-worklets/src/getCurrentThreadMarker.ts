import { HybridWorkletQueueFactory } from './internal/HybridWorkletQueueFactory'

/**
 * Returns a unique identifier for the thread this function is currently
 * running on.
 *
 * This is useful for debugging and asserting which thread a given Worklet is
 * executing on (e.g. the UI thread, a Frame Processor thread, or an
 * {@linkcode AsyncRunner}'s thread).
 *
 * @worklet
 */
export function getCurrentThreadMarker(): number {
  'worklet'
  return HybridWorkletQueueFactory.getCurrentThreadMarker()
}

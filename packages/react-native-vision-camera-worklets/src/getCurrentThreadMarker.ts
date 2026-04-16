import { HybridWorkletQueueFactory } from './internal/HybridWorkletQueueFactory'

export function getCurrentThreadMarker(): number {
  return HybridWorkletQueueFactory.getCurrentThreadMarker()
}

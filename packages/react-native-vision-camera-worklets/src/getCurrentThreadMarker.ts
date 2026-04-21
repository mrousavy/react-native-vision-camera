import { HybridWorkletQueueFactory } from './internal/HybridWorkletQueueFactory'

export function getCurrentThreadMarker(): number {
  'worklet'
  return HybridWorkletQueueFactory.getCurrentThreadMarker()
}

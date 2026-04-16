import {
  canonicalPlatformLabels as CANONICAL_PLATFORM_LABELS,
  defaultPlatformOrder as DEFAULT_PLATFORM_ORDER,
} from '../../../config/platforms'
import {
  normalizeHeadingTitle,
  normalizePlatformLabelWithLookup,
  orderPlatformLabelsWithOrder,
} from './platforms-core'
export { normalizeHeadingTitle }

export function normalizePlatformLabel(value: string): string | null {
  return normalizePlatformLabelWithLookup(value, CANONICAL_PLATFORM_LABELS)
}

export function orderPlatformLabels(labels: Iterable<string>): string[] {
  return orderPlatformLabelsWithOrder(labels, DEFAULT_PLATFORM_ORDER)
}

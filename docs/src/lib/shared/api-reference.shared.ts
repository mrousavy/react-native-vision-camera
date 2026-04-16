import { apiReferenceConfig } from '../../../config/api-reference'

export const API_SECTION_NAME_BY_KEY = new Map(
  Object.entries(apiReferenceConfig.sectionNameByKey),
)

export const API_SECTION_PRIORITY = new Map(
  Object.entries(apiReferenceConfig.sectionPriority),
)

export const HYBRID_OBJECT_SECTION_KEYS = new Set(
  apiReferenceConfig.hybridObjectSectionKeys,
)

export function normalizeApiSectionKey(value: string | undefined): string {
  if (typeof value !== 'string') {
    return ''
  }

  return value.toLowerCase().replace(/[^a-z]/g, '')
}

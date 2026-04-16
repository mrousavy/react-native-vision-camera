export type PlatformConfig = {
  canonicalLabels: Record<string, string>
  defaultOrder: readonly string[]
}

export const platformConfig = {
  canonicalLabels: {
    ios: 'iOS',
    android: 'Android',
  },
  defaultOrder: ['iOS', 'Android'],
} satisfies PlatformConfig

export const canonicalPlatformLabels = new Map(
  Object.entries(platformConfig.canonicalLabels),
)

export const defaultPlatformOrder = [...platformConfig.defaultOrder]

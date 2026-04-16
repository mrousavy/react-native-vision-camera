const PLATFORMS_FIELD = '__visionCameraPlatforms' as const

type ReflectionWithPlatforms<T extends object = object> = T & {
  [PLATFORMS_FIELD]?: string[]
}

export function getReflectionPlatforms<T extends object>(
  reflection: ReflectionWithPlatforms<T>,
): string[] {
  return reflection[PLATFORMS_FIELD] ?? []
}

export function setReflectionPlatforms<T extends object>(
  reflection: ReflectionWithPlatforms<T>,
  platforms: readonly string[],
): void {
  if (platforms.length === 0) {
    delete reflection[PLATFORMS_FIELD]
    return
  }

  reflection[PLATFORMS_FIELD] = Array.from(platforms)
}

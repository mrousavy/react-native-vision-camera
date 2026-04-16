import { cn } from '@/lib/cn'

const DEFAULT_CONTAINER_CLASS_NAME = 'mb-0.5 mt-0.5 flex flex-wrap gap-1.5'
const DEFAULT_PILL_CLASS_NAME =
  'inline-flex items-center rounded-full border border-fd-border/70 px-3 py-1 text-xs font-medium text-fd-muted-foreground'

type PlatformPillsProps = {
  platforms: string[]
  containerClassName?: string
  pillClassName?: string
}

export function PlatformPills({
  platforms,
  containerClassName,
  pillClassName,
}: PlatformPillsProps) {
  if (platforms.length === 0) {
    return null
  }

  return (
    <div className={cn(DEFAULT_CONTAINER_CLASS_NAME, containerClassName)}>
      {platforms.map((platform) => (
        <span
          key={platform}
          className={cn(DEFAULT_PILL_CLASS_NAME, pillClassName)}
        >
          {platform}
        </span>
      ))}
    </div>
  )
}

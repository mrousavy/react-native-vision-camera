import { Cards } from 'fumadocs-ui/components/card'
import {
  Download,
  type LucideIcon,
  Package,
  PencilLine,
  TrendingUp,
} from 'lucide-react'
import Image, { type StaticImageData } from 'next/image'
import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/cn'

// Fumadocs keeps these component props and children in processed Markdown, so
// the catalog stays readable to LLMs while this component owns the visual UI.
type InstallMetricKind = 'lifetime-installs' | 'monthly-downloads'

export type InstallMetricProps = {
  kind: InstallMetricKind
  value: number
  children: ReactNode
}

export type ProductionAppProps = {
  name: string
  company: string
  iconSrc: string | StaticImageData
  appStoreUrl?: string
  playStoreUrl?: string
  children: ReactNode
}

function isInstallMetric(
  child: ReactNode,
): child is ReactElement<InstallMetricProps> {
  return (
    isValidElement<InstallMetricProps>(child) && child.type === InstallMetric
  )
}

function getInstallMetrics(children: ReactNode) {
  return Children.toArray(children).filter(isInstallMetric)
}

function isProductionApp(
  child: ReactNode,
): child is ReactElement<ProductionAppProps> {
  return (
    isValidElement<ProductionAppProps>(child) && child.type === ProductionApp
  )
}

function sumMetrics(apps: ProductionAppProps[], kind: InstallMetricKind) {
  return apps.reduce(
    (sum, app) =>
      sum +
      getInstallMetrics(app.children).reduce(
        (appSum, metric) =>
          appSum + (metric.props.kind === kind ? metric.props.value : 0),
        0,
      ),
    0,
  )
}

function formatCompactNumber(value: number) {
  if (value >= 1_000_000_000) {
    return `${new Intl.NumberFormat('en', {
      maximumFractionDigits: 1,
    }).format(value / 1_000_000_000)}B`
  }

  if (value >= 1_000_000) {
    return `${new Intl.NumberFormat('en', {
      maximumFractionDigits: 0,
    }).format(value / 1_000_000)}M`
  }

  if (value >= 1_000) {
    return `${new Intl.NumberFormat('en', {
      maximumFractionDigits: value >= 100_000 ? 0 : 1,
    }).format(value / 1_000)}K`
  }

  return new Intl.NumberFormat('en').format(value)
}

const npmPackageDownloadTotal = 33_880_333

type SummaryStat = {
  label: string
  value: string
  icon: LucideIcon
}

function createSummaryStats(apps: ProductionAppProps[]): SummaryStat[] {
  const knownInstallTotal = sumMetrics(apps, 'lifetime-installs')
  const appStoreMonthlyDownloadTotal = sumMetrics(apps, 'monthly-downloads')

  return [
    {
      label: 'Known installs/downloads',
      value: `${formatCompactNumber(knownInstallTotal)}+`,
      icon: Download,
    },
    {
      label: 'App Store downloads/mo',
      value: `${formatCompactNumber(appStoreMonthlyDownloadTotal)}+`,
      icon: TrendingUp,
    },
    {
      label: 'Total npm downloads',
      value: `${formatCompactNumber(npmPackageDownloadTotal)}+`,
      icon: Package,
    },
  ]
}

// Drawn locally so we do not ship Apple's Design Resources as website content.
function AppIconGridPlaceholder({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 overflow-hidden rounded-[22%] border border-fd-border bg-white text-zinc-500 shadow-sm',
        className,
      )}
    >
      <svg className="size-full" viewBox="0 0 512 512" aria-hidden="true">
        <g
          fill="none"
          stroke="currentColor"
          strokeLinecap="square"
          strokeWidth="1.25"
          vectorEffect="non-scaling-stroke"
        >
          <path d="M0 128h512M0 256h512M0 384h512M128 0v512M256 0v512M384 0v512" />
          <path d="M32 0v512M96 0v512M416 0v512M480 0v512" />
          <path d="M32 32 480 480M480 32 32 480" />
          <circle cx="256" cy="256" r="224" />
          <circle cx="256" cy="256" r="134" />
          <circle cx="256" cy="256" r="96" />
        </g>
      </svg>
    </span>
  )
}

function AppIcon({
  app,
  className,
  decorative = false,
  size,
}: {
  app: ProductionAppProps
  className?: string
  decorative?: boolean
  size: number
}) {
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 overflow-hidden rounded-[22%]',
        className,
      )}
    >
      <Image
        src={app.iconSrc}
        alt={decorative ? '' : `${app.name} iOS app icon`}
        width={size}
        height={size}
        className="relative size-full object-cover"
        draggable={false}
      />
    </span>
  )
}

function AddYourAppCard() {
  return (
    <div
      className="flex h-full flex-col gap-4 rounded-lg border border-dashed border-fd-border bg-fd-card p-4 shadow-sm transition-colors hover:border-fd-primary/45"
      data-add-your-app-card=""
    >
      <div className="flex items-start gap-4">
        <AppIconGridPlaceholder className="size-14" />
        <div className="min-w-0 flex-1">
          <h3 className="m-0 text-lg font-semibold leading-tight tracking-normal text-fd-foreground">
            Your App here
          </h3>
          <p className="mt-1 text-sm text-fd-muted-foreground">
            Using VisionCamera in production?
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 border-t border-fd-border pt-3">
        <p className="m-0 text-sm leading-6 text-fd-muted-foreground">
          Add your app to this list!
        </p>
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLSfKa0_wZV5-2vgTLu_QLF2JEtX0oa9FZsqME9W-GAlq-aqhsA/viewform?usp=publish-editor"
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'mt-auto w-full border-fd-border text-fd-foreground no-underline hover:border-fd-primary/45 hover:bg-transparent hover:text-fd-primary',
          )}
          target="_blank"
          rel="noreferrer"
        >
          <PencilLine className="size-3.5 shrink-0" aria-hidden="true" />
          Edit this page
        </a>
      </div>
    </div>
  )
}

function AppIconStack({ apps }: { apps: ProductionAppProps[] }) {
  return (
    <div className="-space-x-4 flex max-w-full shrink-0 items-center overflow-hidden pl-2 xl:-space-x-3">
      {apps.map((app) => (
        <AppIcon
          key={app.name}
          app={app}
          className="size-12 shadow-md ring-2 ring-fd-background lg:size-14"
          decorative
          size={56}
        />
      ))}
    </div>
  )
}

function SummaryStat({ label, value, icon: Icon }: SummaryStat) {
  return (
    <div className="flex items-center gap-3 py-3 sm:border-l sm:border-fd-border sm:pl-5 sm:first:border-l-0 sm:first:pl-0">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-fd-border bg-fd-muted text-fd-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-xl font-semibold tracking-normal text-fd-foreground">
          {value}
        </span>
        <span className="block text-sm text-fd-muted-foreground">{label}</span>
      </span>
    </div>
  )
}

function StoreLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className={cn(
        buttonVariants({ variant: 'outline', size: 'sm' }),
        'min-w-0 flex-1 whitespace-nowrap border-fd-border text-fd-foreground no-underline hover:border-fd-primary/45 hover:bg-transparent hover:text-fd-primary',
      )}
      target="_blank"
      rel="noreferrer"
    >
      {label}
    </a>
  )
}

function AppCard({ app }: { app: ProductionAppProps }) {
  const installMetrics = getInstallMetrics(app.children)

  return (
    <div
      className="flex h-full flex-col gap-4 rounded-lg border border-fd-border bg-fd-card p-4 shadow-sm transition-colors hover:border-fd-primary/45"
      data-production-app-card=""
    >
      <div className="flex items-start gap-4">
        <AppIcon app={app} className="size-14 shadow-sm" size={56} />
        <div className="min-w-0 flex-1">
          <h3 className="m-0 text-lg font-semibold leading-tight tracking-normal text-fd-foreground">
            {app.name}
          </h3>
          <p className="mt-1 text-sm text-fd-muted-foreground">{app.company}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 border-t border-fd-border pt-3">
        {installMetrics.length > 0 ? (
          <div className="grid gap-1.5">{installMetrics}</div>
        ) : null}
        <div className="mt-auto flex w-full flex-nowrap items-center gap-2">
          {app.appStoreUrl ? (
            <StoreLink href={app.appStoreUrl} label="App Store" />
          ) : null}
          {app.playStoreUrl ? (
            <StoreLink href={app.playStoreUrl} label="Play Store" />
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function InstallMetric({ children }: InstallMetricProps) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-medium text-fd-muted-foreground">
      <Download className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate">{children}</span>
    </span>
  )
}

export function ProductionApp(props: ProductionAppProps) {
  return <AppCard app={props} />
}

export function ProductionAppsShowcase({ children }: { children: ReactNode }) {
  const appElements = Children.toArray(children).filter(isProductionApp)
  const productionApps = appElements.map((element) => element.props)
  const heroIconApps = productionApps.slice(0, 8)
  const summaryStats = createSummaryStats(productionApps)

  return (
    <div className="not-prose mt-8">
      <section className="border-b border-fd-border pb-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold leading-tight tracking-normal text-fd-foreground md:text-4xl">
              VisionCamera is used by apps on your phone.
            </h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-fd-muted-foreground">
              A selection of real apps using react-native-vision-camera in
              production.
            </p>
          </div>
          <AppIconStack apps={heroIconApps} />
        </div>

        <div className="mt-7 grid gap-1 border-t border-fd-border pt-3 sm:grid-cols-3">
          {summaryStats.map((stat) => (
            <SummaryStat key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      <Cards className="mt-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {appElements}
        <AddYourAppCard />
      </Cards>
    </div>
  )
}

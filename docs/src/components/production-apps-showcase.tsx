import { Cards } from 'fumadocs-ui/components/card'
import { Download, Package, TrendingUp } from 'lucide-react'
import Image from 'next/image'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/cn'

type InstallMetric = {
  label: string
  value: number
  kind: 'lifetime-installs' | 'monthly-downloads'
}

type ProductionApp = {
  name: string
  company: string
  category: string
  installMetrics: InstallMetric[]
  iconSrc: string
  appStoreUrl: string
  playStoreUrl?: string
}

const productionApps: ProductionApp[] = [
  {
    name: 'Xbox',
    company: 'Microsoft',
    category: 'Gaming companion',
    installMetrics: [
      {
        label: '600K/mo App Store downloads est.',
        value: 600_000,
        kind: 'monthly-downloads',
      },
      {
        label: '100M+ Play Store installs',
        value: 100_000_000,
        kind: 'lifetime-installs',
      },
    ],
    iconSrc: '/img/production-apps/xbox.jpg',
    appStoreUrl: 'https://apps.apple.com/us/app/xbox/id736179781',
    playStoreUrl:
      'https://play.google.com/store/apps/details?id=com.microsoft.xboxone.smartglass',
  },
  {
    name: 'PlayStation App',
    company: 'PlayStation Mobile',
    category: 'Gaming companion',
    installMetrics: [
      {
        label: '800K/mo App Store downloads est.',
        value: 800_000,
        kind: 'monthly-downloads',
      },
      {
        label: '100M+ Play Store installs',
        value: 100_000_000,
        kind: 'lifetime-installs',
      },
    ],
    iconSrc: '/img/production-apps/playstation-app.jpg',
    appStoreUrl: 'https://apps.apple.com/us/app/playstation-app/id410896080',
    playStoreUrl:
      'https://play.google.com/store/apps/details?id=com.scee.psxandroid',
  },
  {
    name: 'Shopify',
    company: 'Shopify',
    category: 'Commerce',
    installMetrics: [
      {
        label: '400K/mo App Store downloads est.',
        value: 400_000,
        kind: 'monthly-downloads',
      },
      {
        label: '10M+ Play Store installs',
        value: 10_000_000,
        kind: 'lifetime-installs',
      },
    ],
    iconSrc: '/img/production-apps/shopify.jpg',
    appStoreUrl:
      'https://apps.apple.com/us/app/shopify-sell-online-in-person/id371294472',
    playStoreUrl:
      'https://play.google.com/store/apps/details?id=com.shopify.mobile',
  },
  {
    name: 'Picnic',
    company: 'Picnic',
    category: 'Online supermarket',
    installMetrics: [
      {
        label: '90K/mo App Store downloads est.',
        value: 90_000,
        kind: 'monthly-downloads',
      },
      {
        label: '5M+ Play Store installs',
        value: 5_000_000,
        kind: 'lifetime-installs',
      },
    ],
    iconSrc: '/img/production-apps/picnic.jpg',
    appStoreUrl:
      'https://apps.apple.com/us/app/picnic-order-cook-eat/id1018175041',
    playStoreUrl:
      'https://play.google.com/store/apps/details?id=com.picnic.android',
  },
  {
    name: 'Starlink',
    company: 'SpaceX',
    category: 'Connectivity',
    installMetrics: [
      {
        label: '500K/mo App Store downloads est.',
        value: 500_000,
        kind: 'monthly-downloads',
      },
      {
        label: '10M+ Play Store installs',
        value: 10_000_000,
        kind: 'lifetime-installs',
      },
    ],
    iconSrc: '/img/production-apps/starlink.jpg',
    appStoreUrl: 'https://apps.apple.com/us/app/starlink/id1537177988',
    playStoreUrl:
      'https://play.google.com/store/apps/details?id=com.starlink.mobile',
  },
  {
    name: 'Expensify',
    company: 'Expensify',
    category: 'Expense management',
    installMetrics: [
      {
        label: '20K/mo App Store downloads est.',
        value: 20_000,
        kind: 'monthly-downloads',
      },
      {
        label: '1M+ Play Store installs',
        value: 1_000_000,
        kind: 'lifetime-installs',
      },
    ],
    iconSrc: '/img/production-apps/expensify.jpg',
    appStoreUrl:
      'https://apps.apple.com/us/app/expensify-travel-expense/id471713959',
    playStoreUrl:
      'https://play.google.com/store/apps/details?id=org.me.mobiexpensifyg',
  },
  {
    name: 'MetaMask',
    company: 'Consensys',
    category: 'Crypto wallet',
    installMetrics: [
      {
        label: '200K/mo App Store downloads est.',
        value: 200_000,
        kind: 'monthly-downloads',
      },
      {
        label: '10M+ Play Store installs',
        value: 10_000_000,
        kind: 'lifetime-installs',
      },
    ],
    iconSrc: '/img/production-apps/metamask.jpg',
    appStoreUrl:
      'https://apps.apple.com/us/app/metamask-trade-crypto/id1438144202',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=io.metamask',
  },
  {
    name: 'Ledger Live',
    company: 'Ledger',
    category: 'Crypto wallet',
    installMetrics: [
      {
        label: '30K/mo App Store downloads est.',
        value: 30_000,
        kind: 'monthly-downloads',
      },
      {
        label: '1M+ Play Store installs',
        value: 1_000_000,
        kind: 'lifetime-installs',
      },
    ],
    iconSrc: '/img/production-apps/ledger-live.jpg',
    appStoreUrl:
      'https://apps.apple.com/us/app/ledger-wallet-crypto-app/id1361671700',
    playStoreUrl:
      'https://play.google.com/store/apps/details?id=com.ledger.live',
  },
  {
    name: 'VSCO Capture',
    company: 'Visual Supply Company',
    category: 'Camera app',
    installMetrics: [
      {
        label: '10K/mo App Store downloads est.',
        value: 10_000,
        kind: 'monthly-downloads',
      },
    ],
    iconSrc: '/img/production-apps/vsco-capture.jpg',
    appStoreUrl:
      'https://apps.apple.com/us/app/vsco-capture-photo-video/id6741483219',
  },
]

function sumMetrics(kind: InstallMetric['kind']) {
  return productionApps.reduce(
    (sum, app) =>
      sum +
      app.installMetrics.reduce(
        (appSum, metric) => appSum + (metric.kind === kind ? metric.value : 0),
        0,
      ),
    0,
  )
}

function formatCompactNumber(value: number) {
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

const knownInstallTotal = sumMetrics('lifetime-installs')
const appStoreMonthlyDownloadTotal = sumMetrics('monthly-downloads')
const npmPackageDownloadTotal = 33_880_333

const summaryStats = [
  {
    label: 'Known public installs',
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

function AppIconStack() {
  return (
    <div className="-space-x-4 flex max-w-full shrink-0 items-center overflow-hidden pl-2 lg:-space-x-3">
      {productionApps.map((app) => (
        <Image
          key={app.name}
          src={app.iconSrc}
          alt=""
          width={56}
          height={56}
          className="size-12 rounded-[22%] border border-white/70 bg-white object-cover shadow-md ring-2 ring-fd-background lg:size-14 dark:border-zinc-900/10"
          draggable={false}
        />
      ))}
    </div>
  )
}

function SummaryStat({
  label,
  value,
  icon: Icon,
}: (typeof summaryStats)[number]) {
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

function AppCard({ app }: { app: ProductionApp }) {
  return (
    <div
      className="flex h-full flex-col gap-4 rounded-lg border border-fd-border bg-fd-card p-4 shadow-sm transition-colors hover:border-fd-primary/45"
      data-production-app-card=""
    >
      <div className="flex items-center gap-4">
        <Image
          src={app.iconSrc}
          alt={`${app.name} iOS app icon`}
          width={56}
          height={56}
          className="size-14 shrink-0 rounded-[22%] border border-fd-border bg-white object-cover shadow-sm"
          draggable={false}
        />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="m-0 text-lg font-semibold leading-tight tracking-normal text-fd-foreground">
              {app.name}
            </h3>
            <span className="rounded-md border border-fd-border px-2 py-0.5 text-xs font-medium text-fd-muted-foreground">
              {app.category}
            </span>
          </div>
          <p className="mt-1 text-sm text-fd-muted-foreground">{app.company}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 border-t border-fd-border pt-3">
        <div className="grid gap-1.5">
          {app.installMetrics.map((metric) => (
            <span
              key={metric.label}
              className="inline-flex min-w-0 items-center gap-1.5 text-xs font-medium text-fd-muted-foreground"
            >
              <Download className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{metric.label}</span>
            </span>
          ))}
        </div>
        <div className="mt-auto flex w-full flex-nowrap items-center gap-2">
          <StoreLink href={app.appStoreUrl} label="App Store" />
          {app.playStoreUrl ? (
            <StoreLink href={app.playStoreUrl} label="Play Store" />
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function ProductionAppsShowcase() {
  return (
    <div className="not-prose mt-8">
      <section className="border-b border-fd-border pb-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold leading-tight tracking-normal text-fd-foreground md:text-4xl">
              VisionCamera is used by apps on your phone.
            </h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-fd-muted-foreground">
              A selection of real apps using react-native-vision-camera in
              production.
            </p>
          </div>
          <AppIconStack />
        </div>

        <div className="mt-7 grid gap-1 border-t border-fd-border pt-3 sm:grid-cols-3">
          {summaryStats.map((stat) => (
            <SummaryStat key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      <Cards className="mt-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {productionApps.map((app) => (
          <AppCard key={app.name} app={app} />
        ))}
      </Cards>
    </div>
  )
}

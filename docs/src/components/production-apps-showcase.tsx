import { BadgeCheck, Camera, Download, ExternalLink, Store } from 'lucide-react'
import Image from 'next/image'

type ProductionApp = {
  name: string
  company: string
  category: string
  downloads: string
  iconSrc: string
  appStoreUrl: string
  playStoreUrl?: string
}

const productionApps: ProductionApp[] = [
  {
    name: 'Xbox',
    company: 'Microsoft',
    category: 'Gaming companion',
    downloads: '100M+ Play Store installs',
    iconSrc: '/img/production-apps/xbox.jpg',
    appStoreUrl: 'https://apps.apple.com/us/app/xbox/id736179781',
    playStoreUrl:
      'https://play.google.com/store/apps/details?id=com.microsoft.xboxone.smartglass',
  },
  {
    name: 'PlayStation App',
    company: 'PlayStation Mobile',
    category: 'Gaming companion',
    downloads: '100M+ Play Store installs',
    iconSrc: '/img/production-apps/playstation-app.jpg',
    appStoreUrl: 'https://apps.apple.com/us/app/playstation-app/id410896080',
    playStoreUrl:
      'https://play.google.com/store/apps/details?id=com.scee.psxandroid',
  },
  {
    name: 'Shopify',
    company: 'Shopify',
    category: 'Commerce',
    downloads: '10M+ Play Store installs',
    iconSrc: '/img/production-apps/shopify.jpg',
    appStoreUrl:
      'https://apps.apple.com/us/app/shopify-sell-online-in-person/id371294472',
    playStoreUrl:
      'https://play.google.com/store/apps/details?id=com.shopify.mobile',
  },
  {
    name: 'Starlink',
    company: 'SpaceX',
    category: 'Connectivity',
    downloads: '10M+ Play Store installs',
    iconSrc: '/img/production-apps/starlink.jpg',
    appStoreUrl: 'https://apps.apple.com/us/app/starlink/id1537177988',
    playStoreUrl:
      'https://play.google.com/store/apps/details?id=com.starlink.mobile',
  },
  {
    name: 'MetaMask',
    company: 'Consensys',
    category: 'Crypto wallet',
    downloads: '10M+ Play Store installs',
    iconSrc: '/img/production-apps/metamask.jpg',
    appStoreUrl:
      'https://apps.apple.com/us/app/metamask-trade-crypto/id1438144202',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=io.metamask',
  },
  {
    name: 'Ledger Live',
    company: 'Ledger',
    category: 'Crypto wallet',
    downloads: '1M+ Play Store installs',
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
    downloads: 'App Store downloads not public',
    iconSrc: '/img/production-apps/vsco-capture.jpg',
    appStoreUrl:
      'https://apps.apple.com/us/app/vsco-capture-photo-video/id6741483219',
  },
]

const summaryStats = [
  {
    label: 'Production apps',
    value: '7',
    icon: BadgeCheck,
  },
  {
    label: 'Known public installs',
    value: '231M+',
    icon: Download,
  },
  {
    label: 'App Store / Play Store links',
    value: '13',
    icon: Store,
  },
]

function AppIconStack() {
  return (
    <div className="flex shrink-0 items-center -space-x-3">
      {productionApps.map((app) => (
        <Image
          key={app.name}
          src={app.iconSrc}
          alt=""
          width={56}
          height={56}
          className="size-14 rounded-[22%] border border-white/70 bg-white object-cover shadow-md ring-2 ring-fd-background dark:border-zinc-900/10"
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
    <div className="flex items-center gap-3 border-fd-border py-4 sm:border-l sm:first:border-l-0 sm:pl-5 sm:first:pl-0">
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
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-fd-border px-2.5 py-1.5 text-xs font-medium text-fd-foreground no-underline transition-colors hover:border-fd-primary/45 hover:text-fd-primary"
      target="_blank"
      rel="noreferrer"
    >
      {label}
      <ExternalLink className="size-3" aria-hidden="true" />
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

      <div className="grid gap-3 border-t border-fd-border pt-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-fd-muted-foreground">
          <Download className="size-3.5" aria-hidden="true" />
          {app.downloads}
        </span>
        <div className="flex flex-nowrap items-center gap-2">
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
      <section className="border-y border-fd-border py-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-md border border-fd-border bg-fd-muted px-3 py-1 text-sm font-medium text-fd-muted-foreground">
              <Camera className="size-4" aria-hidden="true" />
              Production apps
            </div>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-normal text-fd-foreground md:text-4xl">
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

      <section className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {productionApps.map((app) => (
          <AppCard key={app.name} app={app} />
        ))}
      </section>
    </div>
  )
}

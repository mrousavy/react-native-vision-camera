import { Camera, ExternalLink, Smartphone } from 'lucide-react'
import Image from 'next/image'

type ProductionApp = {
  name: string
  company: string
  category: string
  iconSrc: string
  appStoreUrl: string
}

const productionApps: ProductionApp[] = [
  {
    name: 'Xbox',
    company: 'Microsoft',
    category: 'Gaming companion',
    iconSrc: '/img/production-apps/xbox.jpg',
    appStoreUrl: 'https://apps.apple.com/us/app/xbox/id736179781',
  },
  {
    name: 'PlayStation App',
    company: 'PlayStation Mobile',
    category: 'Gaming companion',
    iconSrc: '/img/production-apps/playstation-app.jpg',
    appStoreUrl: 'https://apps.apple.com/us/app/playstation-app/id410896080',
  },
  {
    name: 'Shopify',
    company: 'Shopify',
    category: 'Commerce',
    iconSrc: '/img/production-apps/shopify.jpg',
    appStoreUrl:
      'https://apps.apple.com/us/app/shopify-sell-online-in-person/id371294472',
  },
  {
    name: 'Starlink',
    company: 'SpaceX',
    category: 'Connectivity',
    iconSrc: '/img/production-apps/starlink.jpg',
    appStoreUrl: 'https://apps.apple.com/us/app/starlink/id1537177988',
  },
  {
    name: 'MetaMask',
    company: 'Consensys',
    category: 'Crypto wallet',
    iconSrc: '/img/production-apps/metamask.jpg',
    appStoreUrl:
      'https://apps.apple.com/us/app/metamask-trade-crypto/id1438144202',
  },
  {
    name: 'Ledger Live',
    company: 'Ledger',
    category: 'Crypto wallet',
    iconSrc: '/img/production-apps/ledger-live.jpg',
    appStoreUrl:
      'https://apps.apple.com/us/app/ledger-wallet-crypto-app/id1361671700',
  },
  {
    name: 'VSCO Capture',
    company: 'Visual Supply Company',
    category: 'Camera app',
    iconSrc: '/img/production-apps/vsco-capture.jpg',
    appStoreUrl:
      'https://apps.apple.com/us/app/vsco-capture-photo-video/id6741483219',
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

function AppCard({ app }: { app: ProductionApp }) {
  return (
    <div
      className="group flex h-full items-center gap-4 rounded-lg border border-fd-border bg-fd-card p-4 shadow-sm transition-colors hover:border-fd-primary/45"
      data-production-app-card=""
    >
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
      <a
        href={app.appStoreUrl}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-fd-border text-fd-muted-foreground no-underline transition-colors hover:border-fd-primary/45 hover:text-fd-primary"
        target="_blank"
        rel="noreferrer"
        aria-label={`Open ${app.name} on the iOS App Store`}
      >
        <Smartphone className="size-4 group-hover:hidden" aria-hidden="true" />
        <ExternalLink
          className="hidden size-4 group-hover:block"
          aria-hidden="true"
        />
      </a>
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
      </section>

      <section className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {productionApps.map((app) => (
          <AppCard key={app.name} app={app} />
        ))}
      </section>
    </div>
  )
}

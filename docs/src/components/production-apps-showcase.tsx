import { Cards } from 'fumadocs-ui/components/card'
import { Download, Package, PencilLine, TrendingUp } from 'lucide-react'
import Image, { type StaticImageData } from 'next/image'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import arbysIcon from '../../public/img/production-apps/arbys.jpg'
import buffaloWildWingsIcon from '../../public/img/production-apps/buffalo-wild-wings.jpg'
import expensifyIcon from '../../public/img/production-apps/expensify.jpg'
import klarnaIcon from '../../public/img/production-apps/klarna.jpg'
import ledgerLiveIcon from '../../public/img/production-apps/ledger-live.jpg'
import metamaskIcon from '../../public/img/production-apps/metamask.jpg'
import nationalCarRentalIcon from '../../public/img/production-apps/national-car-rental.jpg'
import picnicIcon from '../../public/img/production-apps/picnic.jpg'
import playstationAppIcon from '../../public/img/production-apps/playstation-app.jpg'
import pumaIcon from '../../public/img/production-apps/puma.jpg'
import shopifyIcon from '../../public/img/production-apps/shopify.jpg'
import snapcalorieIcon from '../../public/img/production-apps/snapcalorie.jpg'
import sonicDriveInIcon from '../../public/img/production-apps/sonic-drive-in.jpg'
import starlinkIcon from '../../public/img/production-apps/starlink.jpg'
import urbanCompanyIcon from '../../public/img/production-apps/urban-company.jpg'
import vscoCaptureIcon from '../../public/img/production-apps/vsco-capture.jpg'
import xboxIcon from '../../public/img/production-apps/xbox.jpg'

type InstallMetric = {
  label: string
  value: number
  kind: 'lifetime-installs' | 'monthly-downloads'
}

type ProductionApp = {
  name: string
  company: string
  installMetrics: InstallMetric[]
  iconSrc: StaticImageData
  appStoreUrl: string
  playStoreUrl?: string
}

const productionApps: ProductionApp[] = [
  {
    name: 'Xbox',
    company: 'Microsoft',
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
    iconSrc: xboxIcon,
    appStoreUrl: 'https://apps.apple.com/us/app/xbox/id736179781',
    playStoreUrl:
      'https://play.google.com/store/apps/details?id=com.microsoft.xboxone.smartglass',
  },
  {
    name: 'PlayStation App',
    company: 'PlayStation Mobile',
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
    iconSrc: playstationAppIcon,
    appStoreUrl: 'https://apps.apple.com/us/app/playstation-app/id410896080',
    playStoreUrl:
      'https://play.google.com/store/apps/details?id=com.scee.psxandroid',
  },
  {
    name: 'Shopify',
    company: 'Shopify',
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
    iconSrc: shopifyIcon,
    appStoreUrl:
      'https://apps.apple.com/us/app/shopify-sell-online-in-person/id371294472',
    playStoreUrl:
      'https://play.google.com/store/apps/details?id=com.shopify.mobile',
  },
  {
    name: 'Klarna',
    company: 'Klarna Bank',
    installMetrics: [
      {
        label: '50M+ Play Store installs',
        value: 50_000_000,
        kind: 'lifetime-installs',
      },
    ],
    iconSrc: klarnaIcon,
    appStoreUrl:
      'https://apps.apple.com/us/app/klarna-smarter-everyday-money/id1115120118',
    playStoreUrl:
      'https://play.google.com/store/apps/details?id=com.myklarnamobile',
  },
  {
    name: 'SONIC',
    company: 'Sonic Industries',
    installMetrics: [
      {
        label: '10M+ Play Store installs',
        value: 10_000_000,
        kind: 'lifetime-installs',
      },
    ],
    iconSrc: sonicDriveInIcon,
    appStoreUrl:
      'https://apps.apple.com/us/app/sonic-drive-in-order-online/id867827909',
    playStoreUrl:
      'https://play.google.com/store/apps/details?id=com.sonic.sonicdrivein',
  },
  {
    name: 'Urban Company',
    company: 'Urban Company',
    installMetrics: [
      {
        label: '10M+ Play Store installs',
        value: 10_000_000,
        kind: 'lifetime-installs',
      },
    ],
    iconSrc: urbanCompanyIcon,
    appStoreUrl:
      'https://apps.apple.com/us/app/urban-company-home-services/id1032480595',
    playStoreUrl:
      'https://play.google.com/store/apps/details?id=com.urbanclap.urbanclap',
  },
  {
    name: 'Picnic',
    company: 'Picnic',
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
    iconSrc: picnicIcon,
    appStoreUrl:
      'https://apps.apple.com/us/app/picnic-order-cook-eat/id1018175041',
    playStoreUrl:
      'https://play.google.com/store/apps/details?id=com.picnic.android',
  },
  {
    name: "Arby's",
    company: "Arby's",
    installMetrics: [
      {
        label: '5M+ Play Store installs',
        value: 5_000_000,
        kind: 'lifetime-installs',
      },
    ],
    iconSrc: arbysIcon,
    appStoreUrl:
      'https://apps.apple.com/us/app/arbys-fast-food-sandwiches/id1348507359',
    playStoreUrl:
      'https://play.google.com/store/apps/details?id=com.arbys.android.arbysapp',
  },
  {
    name: 'Buffalo Wild Wings',
    company: 'Buffalo Wild Wings',
    installMetrics: [
      {
        label: '5M+ Play Store installs',
        value: 5_000_000,
        kind: 'lifetime-installs',
      },
    ],
    iconSrc: buffaloWildWingsIcon,
    appStoreUrl:
      'https://apps.apple.com/us/app/buffalo-wild-wings/id1031364004',
    playStoreUrl:
      'https://play.google.com/store/apps/details?id=com.buffalowildwings.blazinrewards',
  },
  {
    name: 'PUMA',
    company: 'PUMA',
    installMetrics: [
      {
        label: '5M+ Play Store installs',
        value: 5_000_000,
        kind: 'lifetime-installs',
      },
    ],
    iconSrc: pumaIcon,
    appStoreUrl:
      'https://apps.apple.com/us/app/puma-clothes-sneakers-app/id1563024677',
    playStoreUrl:
      'https://play.google.com/store/apps/details?id=com.puma.ecom.app',
  },
  {
    name: 'Starlink',
    company: 'SpaceX',
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
    iconSrc: starlinkIcon,
    appStoreUrl: 'https://apps.apple.com/us/app/starlink/id1537177988',
    playStoreUrl:
      'https://play.google.com/store/apps/details?id=com.starlink.mobile',
  },
  {
    name: 'Expensify',
    company: 'Expensify',
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
    iconSrc: expensifyIcon,
    appStoreUrl:
      'https://apps.apple.com/us/app/expensify-travel-expense/id471713959',
    playStoreUrl:
      'https://play.google.com/store/apps/details?id=org.me.mobiexpensifyg',
  },
  {
    name: 'National Car Rental',
    company: 'EAN Services',
    installMetrics: [
      {
        label: '1M+ Play Store installs',
        value: 1_000_000,
        kind: 'lifetime-installs',
      },
    ],
    iconSrc: nationalCarRentalIcon,
    appStoreUrl:
      'https://apps.apple.com/us/app/national-car-rental/id675304115',
    playStoreUrl:
      'https://play.google.com/store/apps/details?id=com.ehi.national.mobile',
  },
  {
    name: 'MetaMask',
    company: 'Consensys',
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
    iconSrc: metamaskIcon,
    appStoreUrl:
      'https://apps.apple.com/us/app/metamask-trade-crypto/id1438144202',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=io.metamask',
  },
  {
    name: 'Ledger Live',
    company: 'Ledger',
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
    iconSrc: ledgerLiveIcon,
    appStoreUrl:
      'https://apps.apple.com/us/app/ledger-wallet-crypto-app/id1361671700',
    playStoreUrl:
      'https://play.google.com/store/apps/details?id=com.ledger.live',
  },
  {
    name: 'SnapCalorie',
    company: 'Perception Labs',
    installMetrics: [
      {
        label: '500K+ Play Store installs',
        value: 500_000,
        kind: 'lifetime-installs',
      },
    ],
    iconSrc: snapcalorieIcon,
    appStoreUrl:
      'https://apps.apple.com/us/app/snapcalorie-ai-calorie-counter/id1574239307',
    playStoreUrl:
      'https://play.google.com/store/apps/details?id=com.snapcalorie.alpha002',
  },
  {
    name: 'VSCO Capture',
    company: 'Visual Supply Company',
    installMetrics: [
      {
        label: '10K/mo App Store downloads est.',
        value: 10_000,
        kind: 'monthly-downloads',
      },
    ],
    iconSrc: vscoCaptureIcon,
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
const heroIconApps = productionApps.slice(0, 8)
const editDocUrl =
  'https://github.com/mrousavy/react-native-vision-camera/edit/main/docs/content/docs/production-apps.mdx'

const summaryStats = [
  {
    label: 'Play Store installs',
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
  app: ProductionApp
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
          href={editDocUrl}
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

function AppIconStack() {
  return (
    <div className="-space-x-4 flex max-w-full shrink-0 items-center overflow-hidden pl-2 xl:-space-x-3">
      {heroIconApps.map((app) => (
        <AppIcon
          key={app.name}
          app={app}
          className="size-12 border border-white/70 shadow-md ring-2 ring-fd-background lg:size-14 dark:border-zinc-900/10"
          decorative
          size={56}
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
      <div className="flex items-start gap-4">
        <AppIcon
          app={app}
          className="size-14 border border-fd-border shadow-sm"
          size={56}
        />
        <div className="min-w-0 flex-1">
          <h3 className="m-0 text-lg font-semibold leading-tight tracking-normal text-fd-foreground">
            {app.name}
          </h3>
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
        <AddYourAppCard />
      </Cards>
    </div>
  )
}

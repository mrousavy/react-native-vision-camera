import { HomeLayout } from 'fumadocs-ui/layouts/home'
import type { Metadata } from 'next'
import { homeOptions } from '@/lib/layout.shared'
import { absoluteUrl, getOgImage, siteConfig } from '@/lib/site-config'

const image = getOgImage('/')
const url = absoluteUrl('/')

export const metadata: Metadata = {
  title: 'VisionCamera - The most powerful React Native Camera library',
  description: siteConfig.description,
  alternates: {
    canonical: url,
  },
  openGraph: {
    siteName: siteConfig.name,
    url,
    images: [image],
  },
  twitter: {
    card: 'summary_large_image',
    images: [image],
  },
}

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <HomeLayout
      {...homeOptions()}
      className="landing-shell fixed inset-0 h-[100lvh] overflow-hidden overscroll-none touch-none md:static md:h-dvh md:touch-auto"
    >
      {children}
    </HomeLayout>
  )
}

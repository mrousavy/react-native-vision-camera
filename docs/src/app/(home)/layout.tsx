import { HomeLayout } from 'fumadocs-ui/layouts/home'
import type { Metadata } from 'next'
import { homeOptions } from '@/lib/layout.shared'
import { getOgImage } from '@/lib/site-config'

const image = getOgImage('/')

export const metadata: Metadata = {
  title: 'VisionCamera - The most powerful React Native Camera library',
  description:
    'The most powerful Camera library for React Native. Supports Photo and Video capture, QR/Barcode scanning, Frame Processors, and more.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
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

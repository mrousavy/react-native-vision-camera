import type { HomeLayoutProps } from 'fumadocs-ui/layouts/home'
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import Image from 'next/image'
import { siteConfig } from '@/lib/site-config'

export const docsShellClassName = 'vc-docs-shell flex flex-col'
export const docsShellHeaderClassName = 'max-md:hidden'
export const docsLayoutContainerClassName = 'vc-docs-layout'
export const apiReferenceSidebarWidthClassName =
  'md:[--fd-sidebar-width:19rem] lg:[--fd-sidebar-width:20rem]'
const LOGO_SIZE = {
  width: 731,
  height: 71,
} as const
const LOGO_WORDMARK_MARGIN_CLASS_NAME = 'ml-2'
const LOGO_WORDMARK_WIDTH_CLASS_NAME = 'w-[150px]'

export function sideBarOptions(): BaseLayoutProps {
  return {
    themeSwitch: {
      enabled: false,
    },
    nav: {
      title: (
        <div
          className={`vc-mobile-sidebar-logo dark:invert ${LOGO_WORDMARK_MARGIN_CLASS_NAME} ${LOGO_WORDMARK_WIDTH_CLASS_NAME} md:hidden`}
        >
          <Image
            src="/vc_logo.svg"
            alt="VisionCamera Logo"
            width={LOGO_SIZE.width}
            height={LOGO_SIZE.height}
            className="block h-auto w-full"
            draggable={false}
            priority
          />
        </div>
      ),
    },
  }
}

export function homeOptions(): HomeLayoutProps {
  return {
    links: [
      {
        text: 'Docs',
        url: '/docs',
        active: 'nested-url',
      },
      {
        text: 'API Reference',
        url: '/api',
        active: 'nested-url',
      },
    ],
    githubUrl: siteConfig.repositoryUrl,
    nav: {
      title: (
        <div
          className={`dark:invert ${LOGO_WORDMARK_MARGIN_CLASS_NAME} ${LOGO_WORDMARK_WIDTH_CLASS_NAME}`}
        >
          <Image
            src="/vc_logo.svg"
            alt="VisionCamera Logo"
            width={LOGO_SIZE.width}
            height={LOGO_SIZE.height}
            className="block h-auto w-full"
            draggable={false}
            priority
          />
        </div>
      ),
    },
  }
}

import { HomeLayoutProps } from 'fumadocs-ui/layouts/home'
import { NavbarMenu, NavbarMenuContent, NavbarMenuLink, NavbarMenuTrigger } from 'fumadocs-ui/layouts/home/navbar'
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import { BookIcon, GithubIcon } from 'lucide-react'
import Image from 'next/image'

export function sideBarOptions(): BaseLayoutProps {
  return {
    themeSwitch: {
      enabled: false,
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
        url: '/api-reference',
        active: 'nested-url',
      },
    ],
    githubUrl: 'https://github.com/mrousavy/react-native-vision-camera',
    nav: {
      title: (
        <div className="dark:invert ml-2">
          <Image src="/vc_logo.svg" alt="VisionCamera Logo" width={150} height={32} />
        </div>
      ),
    },
  }
}

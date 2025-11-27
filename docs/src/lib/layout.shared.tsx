import { NavbarMenu, NavbarMenuContent, NavbarMenuLink, NavbarMenuTrigger } from 'fumadocs-ui/layouts/home/navbar';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { BookIcon, GithubIcon } from 'lucide-react';
import Image from 'next/image';
export function baseOptions(): BaseLayoutProps {
  return {
    githubUrl: 'https://github.com/mrousavy/react-native-vision-camera',
    nav: {
      title: (
        <div className='dark:invert'>
          <Image src="/vc_logo.svg" alt="VisionCamera Logo" width={150} height={32} />
        </div>
      ),
    },
  };
}

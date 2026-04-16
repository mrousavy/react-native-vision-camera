import { HomeLayout } from 'fumadocs-ui/layouts/home'
import {
  docsShellClassName,
  docsShellHeaderClassName,
  homeOptions,
} from '@/lib/layout.shared'

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={docsShellClassName}>
      <HomeLayout {...homeOptions()} className={docsShellHeaderClassName} />
      {children}
    </div>
  )
}

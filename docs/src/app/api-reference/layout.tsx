import { apiReferenceSource } from '@/lib/source'
import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import { sideBarOptions, homeOptions } from '@/lib/layout.shared'
import { Header } from 'fumadocs-ui/layouts/home'

export default function Layout({ children }: LayoutProps<'/api-reference'>) {
  return (
    <div>
      <Header {...homeOptions()} />
      <DocsLayout
        tree={apiReferenceSource.pageTree}
        {...sideBarOptions()}
        sidebar={{ className: 'bg-[--color-fd-background]', collapsible: false }}
        searchToggle={{ enabled: false }}
      >
        {children}
      </DocsLayout>
    </div>
  )
}


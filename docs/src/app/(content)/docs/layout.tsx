import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import {
  docsLayoutContainerClassName,
  sideBarOptions,
} from '@/lib/layout.shared'
import { docsSource } from '@/lib/source'

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <DocsLayout
      tree={docsSource.pageTree}
      {...sideBarOptions()}
      containerProps={{
        className: docsLayoutContainerClassName,
      }}
      sidebar={{
        collapsible: false,
      }}
      searchToggle={{ components: { lg: false } }}
    >
      {children}
    </DocsLayout>
  )
}

import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import {
  apiReferenceSidebarWidthClassName,
  docsLayoutContainerClassName,
  sideBarOptions,
} from '@/lib/layout.shared'
import { apiSource } from '@/lib/source'

export default function Layout({ children }: LayoutProps<'/api'>) {
  return (
    <DocsLayout
      tree={apiSource.pageTree}
      {...sideBarOptions()}
      containerProps={{
        className: `api-reference-layout ${docsLayoutContainerClassName} ${apiReferenceSidebarWidthClassName}`,
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
